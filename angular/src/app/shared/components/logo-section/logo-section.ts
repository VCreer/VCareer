import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logo-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logo-section.html',
  styleUrls: ['./logo-section.scss']
})
export class LogoSectionComponent {
  @Input() logoUrl: string = 'assets/images/login/logo-login.png';
  @Input() logoAlt: string = 'Logo';
  @Input() title: string = 'VCareer';
  @Input() subtitle: string = '';
  @Input() logoSize: number = 120;
  @Input() titleSize: number = 36;
  @Input() subtitleSize: number = 18;
}
