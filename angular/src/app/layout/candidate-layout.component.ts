import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderWrapperComponent } from '../features/header/header-wrapper.component';

@Component({
  selector: 'app-candidate-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderWrapperComponent],
  templateUrl: './candidate-layout.component.html',
  styleUrls: ['./candidate-layout.component.scss']
})
export class CandidateLayoutComponent {
}
