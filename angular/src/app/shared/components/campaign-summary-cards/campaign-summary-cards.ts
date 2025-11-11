import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SummaryCard {
  label: string;
  value: number;
  icon: string;
  type: 'total' | 'applied' | 'contact';
}

@Component({
  selector: 'app-campaign-summary-cards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './campaign-summary-cards.html',
  styleUrls: ['./campaign-summary-cards.scss']
})
export class CampaignSummaryCardsComponent {
  @Input() cards: SummaryCard[] = [];
}

