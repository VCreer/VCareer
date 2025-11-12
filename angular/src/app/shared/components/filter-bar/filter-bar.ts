import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryTreeDto, CategoryApiService } from '../../../apiTest/api/category.service';
import {
  ProvinceDto,
  DistrictDto,
  LocationApiService,
} from '../../../apiTest/api/location.service';
import { TranslationService } from '../../../core/services/translation.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

/**
 * FilterBar Component - Refactored cho trang HOME
 * Hiển thị dropdown Category (3 cấp) và Location (Province + District) với checkbox
 */
@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-bar.html',
  styleUrls: ['./filter-bar.scss'],
})
export class FilterBarComponent implements OnInit, OnChanges, OnDestroy {
  // Input data từ parent (CandidateHomepage)
  @Input() categories: CategoryTreeDto[] = []; // Category tree từ API
  @Input() provinces: ProvinceDto[] = []; // Province tree từ API

  // ✅ Input: Pre-selected filters (from query params)
  @Input() selectedCategoryIds: string[] = [];
  @Input() selectedProvinceIds: number[] = [];
  @Input() selectedDistrictIds: number[] = [];

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
  internalSelectedProvinceCodes: Set<number> = new Set(); // Changed to use code instead of id
  internalSelectedDistrictCodes: Set<number> = new Set(); // Changed to use code instead of id

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
    private categoryApi: CategoryApiService,
    private locationApi: LocationApiService
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
    this.filteredCategories = [...this.categories];
    this.filteredProvinces = [...this.provinces];

    // ✅ Clear search keywords
    this.categorySearchKeyword = '';
    this.locationSearchKeyword = '';
  }

  ngOnChanges(changes: any) {
    // ✅ Update khi parent truyền data mới
    if (changes['categories'] && this.categories) {
      this.filteredCategories = [...this.categories];
      console.log('✅ FilterBar received categories:', this.categories.length);

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
      console.log('✅ FilterBar received provinces:', this.provinces.length);
    }

    // ✅ Restore selected filters (from query params)
    if (changes['selectedCategoryIds'] && this.selectedCategoryIds) {
      console.log('✅ Restoring selected categories:', this.selectedCategoryIds);
      // Restore selected leaf nodes
      this.internalSelectedCategoryIds = new Set(this.selectedCategoryIds);
      // ✅ Ensure parent levels (level 1, level 2) are also marked as selected
      // so that level-1 checkboxes appear checked/blue when any descendant is selected
      for (const catId of this.selectedCategoryIds) {
        this.selectParents(catId);
      }
    }

    if (changes['selectedProvinceIds'] && this.selectedProvinceIds) {
      console.log('✅ Restoring selected provinces:', this.selectedProvinceIds);
      this.internalSelectedProvinceCodes = new Set(this.selectedProvinceIds);
    }

    if (changes['selectedDistrictIds'] && this.selectedDistrictIds) {
      console.log('✅ Restoring selected districts:', this.selectedDistrictIds);
      this.internalSelectedDistrictCodes = new Set(this.selectedDistrictIds);
    }
  }

  // ============================================
  // CATEGORY DROPDOWN METHODS
  // ============================================

  toggleCategoryDropdown() {
    this.showCategoryDropdown = !this.showCategoryDropdown;
    if (this.showCategoryDropdown) {
      this.showLocationDropdown = false; // Close location dropdown
      // ✅ FORCE reload data khi mở dropdown
      if (this.categories.length > 0) {
        this.filteredCategories = [...this.categories];
        // ✅ Clear search to show tree
        this.categorySearchKeyword = '';
        this.searchResults = [];
      }
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
    console.log('🔍 Calling Category Search API with keyword:', keyword);

    this.categoryApi.searchCategories(keyword).subscribe({
      next: results => {
        this.searchResults = results;
        this.hasSearchResults = results.length > 0;
        console.log('✅ Category search results:', results.length);
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
    console.log(
      '🔵 Apply Category Filter - selectedCategoryIds:',
      Array.from(this.internalSelectedCategoryIds)
    );

    const leafIds = Array.from(this.internalSelectedCategoryIds).filter(id => {
      const category = this.findCategoryById(id);
      console.log(
        `   - Checking ${id}: isLeaf=${category?.isLeaf}, name=${category?.categoryName}`
      );
      return category?.isLeaf === true;
    });

    console.log('✅ Emitting leaf IDs:', leafIds);
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
        console.log('✅ Location dropdown opened, provinces:', this.filteredProvinces.length);
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
   * ✅ NEW: Perform location search - Call API
   */
  private performLocationSearch(keyword: string) {
    console.log('🔍 Calling Location Search API with keyword:', keyword);

    this.locationApi.searchProvinces(keyword).subscribe({
      next: results => {
        this.filteredProvinces = results;
        this.hasLocationResults = results.length > 0;
        console.log('✅ Location search results:', results.length);
      },
      error: error => {
        console.error('❌ Location search error:', error);
        this.filteredProvinces = [];
        this.hasLocationResults = false;
      },
    });
      }

  /**
   * Toggle province selection (với cascade logic)
   */
  toggleProvinceSelection(provinceCode: number, event: Event) {
    event.stopPropagation();

    const province = this.provinces.find(p => p.code === provinceCode);
    if (!province || !province.code) return;

    if (this.internalSelectedProvinceCodes.has(provinceCode)) {
      // Uncheck province → Uncheck all districts
      this.internalSelectedProvinceCodes.delete(provinceCode);
      if (province.districts) {
        province.districts.forEach(dist => {
          if (dist.code) {
            this.internalSelectedDistrictCodes.delete(dist.code);
          }
        });
      }
    } else {
      // Check province → Check all districts
      this.internalSelectedProvinceCodes.add(provinceCode);
      if (province.districts) {
        province.districts.forEach(dist => {
          if (dist.code) {
            this.internalSelectedDistrictCodes.add(dist.code);
          }
        });
      }
    }
  }

  /**
   * Toggle district selection (với cascade logic)
   */
  toggleDistrictSelection(provinceCode: number, districtCode: number, event: Event) {
    event.stopPropagation();

    const province = this.provinces.find(p => p.code === provinceCode);
    if (!province || !province.code) return;

    if (this.internalSelectedDistrictCodes.has(districtCode)) {
      // Uncheck district
      this.internalSelectedDistrictCodes.delete(districtCode);

      // Nếu không còn district nào được chọn → Uncheck province
      const hasOtherDistricts = province.districts?.some(
        d => d.code && d.code !== districtCode && this.internalSelectedDistrictCodes.has(d.code)
      ) || false;
      if (!hasOtherDistricts) {
        this.internalSelectedProvinceCodes.delete(provinceCode);
      }
    } else {
      // Check district → Auto check province
      this.internalSelectedDistrictCodes.add(districtCode);
      this.internalSelectedProvinceCodes.add(provinceCode);
    }
  }

  /**
   * Check if province is selected
   */
  isProvinceSelected(provinceCode: number | undefined): boolean {
    return provinceCode !== undefined && this.internalSelectedProvinceCodes.has(provinceCode);
  }

  /**
   * Check if district is selected
   */
  isDistrictSelected(districtCode: number | undefined): boolean {
    return districtCode !== undefined && this.internalSelectedDistrictCodes.has(districtCode);
  }

  /**
   * Clear all location selections
   */
  clearAllLocations() {
    this.internalSelectedProvinceCodes.clear();
    this.internalSelectedDistrictCodes.clear();
  }

  /**
   * Apply location filter
   */
  applyLocationFilter() {
    this.locationSelected.emit({
      provinceIds: Array.from(this.internalSelectedProvinceCodes),
      districtIds: Array.from(this.internalSelectedDistrictCodes),
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
    const districtCount = this.internalSelectedDistrictCodes.size;
    const totalCount = provinceCount + districtCount;
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
