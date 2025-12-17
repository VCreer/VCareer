import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthStateService } from '../../core/services/auth-Cookiebased/auth-state.service';
import { getPrimaryRoutingRole } from '../../guards/RoleMapping.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './not-found.html',
  styleUrls: ['./not-found.scss'],
})
export class NotFoundComponent {
  private router = inject(Router);
  private authState = inject(AuthStateService);

  goHome() {
    // Redirect về home page dựa trên role của user
    this.authState.user$.subscribe(user => {
      if (user) {
        const role = getPrimaryRoutingRole(user.roles ?? []);
        if (role === 'EMPLOYEE') {
          this.router.navigate(['/employee/statistical-reports']);
        } else if (role === 'RECRUITER') {
          this.router.navigate(['/recruiter/recruitment-report']);
        } else {
          this.router.navigate(['/home']);
        }
      } else {
        this.router.navigate(['/']);
      }
    }).unsubscribe();
  }

  goBack() {
    // Redirect về trang chính của role thay vì history.back()
    this.authState.user$.subscribe(user => {
      if (user) {
        const role = getPrimaryRoutingRole(user.roles ?? []);
        if (role === 'EMPLOYEE') {
          this.router.navigate(['/employee/statistical-reports']);
        } else if (role === 'RECRUITER') {
          this.router.navigate(['/recruiter/recruitment-report']);
        } else {
          this.router.navigate(['/home']);
        }
      } else {
        this.router.navigate(['/']);
      }
    }).unsubscribe();
  }
}






























