import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer-contact',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer-contact.component.html',
  styleUrls: ['./footer-contact.component.scss']
})
export class FooterContactComponent {
  @Input() hotline = '';
  @Input() email = '';

  reload(): void {
    window.location.reload();
  }
}


