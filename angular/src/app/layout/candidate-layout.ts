import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderWrapperComponent } from '../features/header/header-wrapper';
import { FooterComponent } from '../features/footer/footer';

@Component({
  selector: 'app-candidate-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderWrapperComponent, FooterComponent],
  templateUrl: './candidate-layout.html',
  styleUrls: ['./candidate-layout.scss']
})
export class CandidateLayoutComponent {
}
