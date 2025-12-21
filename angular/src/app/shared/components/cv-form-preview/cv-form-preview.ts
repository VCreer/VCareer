import { Component, Input, Output, EventEmitter, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { CvBlock } from '../../../features/dashboard/write-cv/candidate/write-cv';

export interface CvTemplateSettings {
  layout?: 'one-column' | 'two-column';
  accentColor?: string;
  headingStyle?: 'underline' | 'boxed';
  skillStyle?: 'list' | 'bars';
  timeline?: boolean;
  cleanView?: boolean;
}

@Component({
  selector: 'app-cv-form-preview',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './cv-form-preview.html',
  styleUrls: ['./cv-form-preview.scss']
})
export class CvFormPreviewComponent implements OnInit {
  @Input() blocks: CvBlock[] = [];
  @Input() templateSettings: CvTemplateSettings = {};
  @Output() blocksChange = new EventEmitter<CvBlock[]>();

  @ViewChild('avatarFileInput') avatarFileInput!: ElementRef<HTMLInputElement>;
  isAvatarDragOver = false;

  showAddSectionMenu: boolean = false;

  private defaultTemplateSettings: Required<CvTemplateSettings> = {
    layout: 'one-column',
    accentColor: '#0F83BA',
    headingStyle: 'underline',
    skillStyle: 'list',
    timeline: false,
    cleanView: false
  };

  get mergedSettings(): Required<CvTemplateSettings> {
    return { ...this.defaultTemplateSettings, ...(this.templateSettings || {}) };
  }

  get rootClasses() {
    const settings = this.mergedSettings;
    return {
      'layout-two-column': settings.layout === 'two-column',
      'layout-one-column': settings.layout !== 'two-column',
      'heading-boxed': settings.headingStyle === 'boxed',
      'heading-underline': settings.headingStyle !== 'boxed',
      'skill-style-bars': settings.skillStyle === 'bars',
      'skill-style-list': settings.skillStyle !== 'bars',
      'timeline-mode': settings.timeline,
      'clean-view': settings.cleanView
    };
  }

  get rootStyles() {
    return {
      '--accent-color': this.mergedSettings.accentColor || '#0F83BA'
    } as any;
  }

  // Get blocks by type
  get personalInfoBlock(): CvBlock | undefined {
    return this.blocks.find(b => b.type === 'personal-info');
  }

  get workExperienceBlocks(): CvBlock[] {
    return this.blocks.filter(b => b.type === 'work-experience');
  }

  get educationBlocks(): CvBlock[] {
    return this.blocks.filter(b => b.type === 'education');
  }

  get skillsBlocks(): CvBlock[] {
    return this.blocks.filter(b => b.type === 'skills');
  }

  get projectsBlocks(): CvBlock[] {
    return this.blocks.filter(b => b.type === 'projects');
  }

  get certificatesBlocks(): CvBlock[] {
    return this.blocks.filter(b => b.type === 'certificates');
  }

  get languagesBlocks(): CvBlock[] {
    return this.blocks.filter(b => b.type === 'languages');
  }

  get customTextBlocks(): CvBlock[] {
    return this.blocks.filter(b => b.type === 'custom-text');
  }

  ngOnInit() {
    // Ensure personal info block exists
    if (!this.personalInfoBlock) {
      this.addPersonalInfoBlock();
    }
  }

  addPersonalInfoBlock() {
    const newBlock: CvBlock = {
      id: this.generateId(),
      type: 'personal-info',
      title: 'Thông tin cá nhân',
      data: {
        fullName: '',
        email: '',
        phoneNumber: '',
        dateOfBirth: '',
        address: '',
        gender: null,
        profileImageUrl: '',
        linkedIn: '',
        gitHub: '',
        website: ''
      },
      meta: { pinned: true }
    };
    this.blocks = [newBlock, ...this.blocks];
    this.blocksChange.emit(this.blocks);
  }

  onAvatarUploadClick(event?: Event) {
    event?.stopPropagation();
    this.avatarFileInput?.nativeElement.click();
  }

  onAvatarFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    this.loadAvatarFile(file);
    input.value = '';
  }

  onAvatarDrop(event: DragEvent) {
    event.preventDefault();
    this.isAvatarDragOver = false;
    if (event.dataTransfer?.files?.length) {
      const file = event.dataTransfer.files[0];
      this.loadAvatarFile(file);
      event.dataTransfer.clearData();
    }
  }

  onAvatarDragOver(event: DragEvent) {
    event.preventDefault();
    this.isAvatarDragOver = true;
  }

  onAvatarDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isAvatarDragOver = false;
  }

  onAvatarRemove(event?: Event) {
    event?.stopPropagation();
    const block = this.personalInfoBlock;
    if (block?.data) {
      block.data.profileImageUrl = '';
      this.blocksChange.emit([...this.blocks]);
    }
  }

  private loadAvatarFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const block = this.personalInfoBlock;
      if (block?.data) {
        block.data.profileImageUrl = dataUrl;
        this.blocksChange.emit([...this.blocks]);
      }
    };
    reader.readAsDataURL(file);
  }

  onBlockDataChange(blockId: string, newData: any) {
    const block = this.blocks.find(b => b.id === blockId);
    if (block) {
      block.data = { ...block.data, ...newData };
      this.blocksChange.emit([...this.blocks]);
    }
  }

  onSectionTitleChange(blockId: string, newTitle: string) {
    const block = this.blocks.find(b => b.id === blockId);
    if (block) {
      block.title = newTitle;
      this.blocksChange.emit([...this.blocks]);
    }
  }

  addSection(type: string) {
    const newBlock: CvBlock = {
      id: this.generateId(),
      type: type as any,
      title: this.getBlockTitle(type),
      data: this.getDefaultBlockData(type),
      meta: {}
    };
    this.blocks = [...this.blocks, newBlock];
    this.blocksChange.emit(this.blocks);
  }

  private getBlockTitle(type: string): string {
    const titles: Record<string, string> = {
      'work-experience': 'Kinh nghiệm làm việc',
      'education': 'Học vấn',
      'skills': 'Kỹ năng',
      'projects': 'Dự án',
      'certificates': 'Chứng chỉ',
      'languages': 'Ngoại ngữ',
      'custom-text': 'Mục tiêu nghề nghiệp'
    };
    return titles[type] || 'Section';
  }

  private getDefaultBlockData(type: string): any {
    switch (type) {
      case 'work-experience':
        return { items: [{ companyName: '', position: '', startDate: '', endDate: '', isCurrentJob: false, description: '', achievements: [] }] };
      case 'education':
        return { items: [{ institutionName: '', major: '', degree: '', startDate: '', endDate: '', isCurrent: false, description: '' }] };
      case 'skills':
        return { items: [{ skillName: '', level: '' }] };
      case 'projects':
        return { items: [{ projectName: '', description: '', technologies: '', projectUrl: '' }] };
      case 'certificates':
        return { items: [{ certificateName: '', issuingOrganization: '', issueDate: '' }] };
      case 'languages':
        return { items: [{ languageName: '', proficiencyLevel: '' }] };
      case 'custom-text':
        return { html: '' };
      default:
        return {};
    }
  }

  removeBlock(blockId: string) {
    const block = this.blocks.find(b => b.id === blockId);
    if (block && !block.meta?.pinned) {
      this.blocks = this.blocks.filter(b => b.id !== blockId);
      this.blocksChange.emit(this.blocks);
    }
  }

  duplicateBlock(blockId: string) {
    const block = this.blocks.find(b => b.id === blockId);
    if (block && !block.meta?.pinned) {
      const newBlock: CvBlock = {
        id: this.generateId(),
        type: block.type,
        title: block.title,
        data: JSON.parse(JSON.stringify(block.data)), // Deep copy
        meta: {}
      };
      const index = this.blocks.findIndex(b => b.id === blockId);
      this.blocks = [...this.blocks.slice(0, index + 1), newBlock, ...this.blocks.slice(index + 1)];
      this.blocksChange.emit(this.blocks);
    }
  }

  // Add item to block (work experience, education, etc.)
  addItemToBlock(blockId: string) {
    const block = this.blocks.find(b => b.id === blockId);
    if (!block || !block.data.items) return;

    const newItem = this.getDefaultItemForBlock(block.type);
    block.data.items = [...(block.data.items || []), newItem];
    this.blocksChange.emit([...this.blocks]);
  }

  // Remove item from block
  removeItemFromBlock(blockId: string, itemIndex: number) {
    const block = this.blocks.find(b => b.id === blockId);
    if (!block || !block.data.items) return;

    if (block.data.items.length > 1) {
      block.data.items.splice(itemIndex, 1);
      this.blocksChange.emit([...this.blocks]);
    }
  }

  // Drag & drop items within a block
  onItemDrop(event: CdkDragDrop<any[]>, blockId: string) {
    const block = this.blocks.find(b => b.id === blockId);
    if (!block || !block.data.items) return;

    moveItemInArray(block.data.items, event.previousIndex, event.currentIndex);
    this.blocksChange.emit([...this.blocks]);
  }

  // Drag & drop blocks
  onBlockDrop(event: CdkDragDrop<CvBlock[]>) {
    const sourceBlock = this.blocks[event.previousIndex];
    const targetBlock = this.blocks[event.currentIndex];

    if (sourceBlock.meta?.pinned || targetBlock.meta?.pinned) {
      return; // Can't move pinned blocks
    }

    moveItemInArray(this.blocks, event.previousIndex, event.currentIndex);
    this.blocksChange.emit([...this.blocks]);
  }

  private getDefaultItemForBlock(blockType: string): any {
    switch (blockType) {
      case 'work-experience':
        return { companyName: '', position: '', startDate: '', endDate: '', isCurrentJob: false, description: '', achievements: [] };
      case 'education':
        return { institutionName: '', major: '', degree: '', startDate: '', endDate: '', isCurrent: false, description: '' };
      case 'skills':
        return { skillName: '', level: '' };
      case 'projects':
        return { projectName: '', description: '', technologies: '', projectUrl: '' };
      case 'certificates':
        return { certificateName: '', issuingOrganization: '', issueDate: '' };
      case 'languages':
        return { languageName: '', proficiencyLevel: '' };
      default:
        return {};
    }
  }

  private generateId(): string {
    return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
  }
}

