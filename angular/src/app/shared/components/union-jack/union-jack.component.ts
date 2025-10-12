import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-union-jack',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="union-jack">
      <div class="diagonal-line-1"></div>
      <div class="diagonal-line-2"></div>
      <div class="st-patrick-cross-1"></div>
      <div class="st-patrick-cross-2"></div>
      <div class="cross-horizontal"></div>
      <div class="cross-vertical"></div>
    </div>
  `,
  styles: [`
    .union-jack {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      
      // St. Andrew's Cross (White diagonals) - base layer
      .diagonal-line-1, .diagonal-line-2 {
        position: absolute;
        background: #FFFFFF;
        width: 100%;
        height: 4px;
        top: 50%;
        left: 0;
        transform: translateY(-50%) rotate(45deg);
        transform-origin: center;
        z-index: 1;
      }
      .diagonal-line-2 {
        transform: translateY(-50%) rotate(-45deg);
      }

      // St. Patrick's Cross (Red diagonals with offset)
      .st-patrick-cross-1, .st-patrick-cross-2 {
        position: absolute;
        background: #EF4444;
        width: 100%;
        height: 2px;
        top: 50%;
        left: 0;
        z-index: 2;
      }
      .st-patrick-cross-1 {
        transform: translateY(-50%) rotate(45deg) translateX(1px);
        transform-origin: center;
      }
      .st-patrick-cross-2 {
        transform: translateY(-50%) rotate(-45deg) translateX(-1px);
        transform-origin: center;
      }

      // St. George's Cross (Red horizontal/vertical with white border)
      .cross-horizontal, .cross-vertical {
        position: absolute;
        background: #EF4444;
        z-index: 3;
        box-shadow: 0 0 0 1px #FFFFFF;
      }

      .cross-horizontal {
        top: 50%;
        left: 0;
        width: 100%;
        height: 4px;
        transform: translateY(-50%);
      }

      .cross-vertical {
        left: 50%;
        top: 0;
        height: 100%;
        width: 4px;
        transform: translateX(-50%);
      }
    }
  `]
})
export class UnionJackComponent {}
