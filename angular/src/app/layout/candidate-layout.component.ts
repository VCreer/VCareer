import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { CandidateHeaderComponent } from '../features/header/candidate-header/candidate-header.component';

@Component({
  selector: 'app-candidate-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, CandidateHeaderComponent],
  templateUrl: './candidate-layout.component.html',
  styleUrls: ['./candidate-layout.component.scss']
})
export class CandidateLayoutComponent {
}
