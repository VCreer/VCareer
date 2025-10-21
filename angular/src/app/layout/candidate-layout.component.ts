import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderWrapperComponent } from '../features/header/header-wrapper.component';
import { FooterComponent } from '../features/footer/footer.component';

@Component({
  selector: 'app-candidate-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderWrapperComponent, FooterComponent],
  templateUrl: './candidate-layout.component.html',
  styleUrls: ['./candidate-layout.component.scss']
})
export class CandidateLayoutComponent {
}
