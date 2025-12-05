import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { CvBlock, CvBlockType } from '../../../features/dashboard/write-cv/candidate/write-cv';
import { CvBlockPersonalInfoComponent } from '../cv-block-personal-info/cv-block-personal-info';
import { CvBlockWorkExperienceComponent } from '../cv-block-work-experience/cv-block-work-experience';
import { CvBlockEducationComponent } from '../cv-block-education/cv-block-education';
import { CvBlockSkillsComponent } from '../cv-block-skills/cv-block-skills';
import { CvBlockProjectsComponent } from '../cv-block-projects/cv-block-projects';
import { CvBlockCertificatesComponent } from '../cv-block-certificates/cv-block-certificates';
import { CvBlockLanguagesComponent } from '../cv-block-languages/cv-block-languages';
import { CvBlockCustomTextComponent } from '../cv-block-custom-text/cv-block-custom-text';

@Component({
  selector: 'app-cv-block-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
    CvBlockPersonalInfoComponent,
    CvBlockWorkExperienceComponent,
    CvBlockEducationComponent,
    CvBlockSkillsComponent,
    CvBlockProjectsComponent,
    CvBlockCertificatesComponent,
    CvBlockLanguagesComponent,
    CvBlockCustomTextComponent
  ],
  templateUrl: './cv-block-editor.html',
  styleUrls: ['./cv-block-editor.scss']
})
export class CvBlockEditorComponent implements OnInit, OnChanges {
  @Input() blocks: CvBlock[] = [];
  @Output() blocksChange = new EventEmitter<CvBlock[]>();

  availableBlockTypes: { type: CvBlockType; label: string; icon: string }[] = [
    { type: 'work-experience', label: 'Kinh nghiệm làm việc', icon: 'fa-briefcase' },
    { type: 'education', label: 'Học vấn', icon: 'fa-graduation-cap' },
    { type: 'skills', label: 'Kỹ năng', icon: 'fa-star' },
    { type: 'projects', label: 'Dự án', icon: 'fa-folder' },
    { type: 'certificates', label: 'Chứng chỉ', icon: 'fa-certificate' },
    { type: 'languages', label: 'Ngoại ngữ', icon: 'fa-language' },
    { type: 'custom-text', label: 'Văn bản tùy chỉnh', icon: 'fa-file-text' }
  ];

  showAddBlockMenu = false;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    // Ensure blocks are initialized
    if (!this.blocks || this.blocks.length === 0) {
      this.initializeDefaultBlocks();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['blocks'] && !changes['blocks'].firstChange) {
      // Blocks changed from parent
      this.blocks = [...this.blocks];
    }
  }

  initializeDefaultBlocks() {
    // Personal info block (always first, pinned)
    const personalInfoBlock: CvBlock = {
      id: this.generateId(),
      type: 'personal-info',
      title: 'Thông tin cá nhân',
      data: {
        fullName: '',
        email: '',
        phoneNumber: '',
        dateOfBirth: '',
        address: '',
        profileImageUrl: '',
        linkedIn: '',
        gitHub: '',
        website: ''
      },
      meta: { pinned: true }
    };

    this.blocks = [personalInfoBlock];
    this.emitBlocksChange();
  }

  onDrop(event: CdkDragDrop<CvBlock[]>) {
    // Don't allow moving pinned blocks (personal-info)
    const sourceBlock = this.blocks[event.previousIndex];
    const targetBlock = this.blocks[event.currentIndex];

    if (sourceBlock.meta?.pinned || targetBlock.meta?.pinned) {
      return; // Can't move pinned blocks
    }

    moveItemInArray(this.blocks, event.previousIndex, event.currentIndex);
    this.emitBlocksChange();
  }

  addBlock(type: CvBlockType) {
    const blockConfig = this.availableBlockTypes.find(b => b.type === type);
    if (!blockConfig) return;

    const newBlock: CvBlock = {
      id: this.generateId(),
      type: type,
      title: blockConfig.label,
      data: this.getDefaultDataForBlockType(type),
      meta: {}
    };

    // Insert after personal-info block (index 0) if exists, otherwise at the end
    const insertIndex = this.blocks.findIndex(b => b.type === 'personal-info') >= 0 ? 1 : 0;
    this.blocks.splice(insertIndex, 0, newBlock);
    this.emitBlocksChange();
    this.showAddBlockMenu = false;
  }

  removeBlock(blockId: string) {
    const block = this.blocks.find(b => b.id === blockId);
    if (block?.meta?.pinned) {
      return; // Can't remove pinned blocks
    }

    const index = this.blocks.findIndex(b => b.id === blockId);
    if (index >= 0) {
      this.blocks.splice(index, 1);
      this.emitBlocksChange();
    }
  }

  duplicateBlock(blockId: string) {
    const block = this.blocks.find(b => b.id === blockId);
    if (!block || block.meta?.pinned) {
      return; // Can't duplicate pinned blocks
    }

    const duplicatedBlock: CvBlock = {
      id: this.generateId(),
      type: block.type,
      title: `${block.title} (Bản sao)`,
      data: JSON.parse(JSON.stringify(block.data)), // Deep clone
      meta: { ...block.meta }
    };

    const index = this.blocks.findIndex(b => b.id === blockId);
    this.blocks.splice(index + 1, 0, duplicatedBlock);
    this.emitBlocksChange();
  }

  onBlockDataChange(blockId: string, data: any) {
    const block = this.blocks.find(b => b.id === blockId);
    if (block) {
      block.data = { ...block.data, ...data };
      this.emitBlocksChange();
    }
  }

  toggleBlockCollapse(blockId: string) {
    const block = this.blocks.find(b => b.id === blockId);
    if (block) {
      if (!block.meta) block.meta = {};
      block.meta.collapsed = !block.meta.collapsed;
      this.emitBlocksChange();
    }
  }

  private getDefaultDataForBlockType(type: CvBlockType): any {
    switch (type) {
      case 'work-experience':
        return { items: [] };
      case 'education':
        return { items: [] };
      case 'skills':
        return { items: [] };
      case 'projects':
        return { items: [] };
      case 'certificates':
        return { items: [] };
      case 'languages':
        return { items: [] };
      case 'custom-text':
        return { html: '' };
      default:
        return {};
    }
  }

  private generateId(): string {
    return `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private emitBlocksChange() {
    this.blocksChange.emit([...this.blocks]);
  }

  canMoveUp(index: number): boolean {
    return index > 0 && !this.blocks[index - 1]?.meta?.pinned;
  }

  canMoveDown(index: number): boolean {
    return index < this.blocks.length - 1;
  }

  moveBlockUp(index: number) {
    if (this.canMoveUp(index)) {
      const temp = this.blocks[index];
      this.blocks[index] = this.blocks[index - 1];
      this.blocks[index - 1] = temp;
      this.emitBlocksChange();
    }
  }

  moveBlockDown(index: number) {
    if (this.canMoveDown(index)) {
      const temp = this.blocks[index];
      this.blocks[index] = this.blocks[index + 1];
      this.blocks[index + 1] = temp;
      this.emitBlocksChange();
    }
  }

  getBlockIcon(type: CvBlockType): string {
    const config = this.availableBlockTypes.find(b => b.type === type);
    return config?.icon || 'fa-file-text';
  }

  getBlockLabel(type: CvBlockType): string {
    const config = this.availableBlockTypes.find(b => b.type === type);
    return config?.label || 'Section';
  }
}

