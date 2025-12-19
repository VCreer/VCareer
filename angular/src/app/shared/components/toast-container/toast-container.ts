import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ToastNotificationService } from '../../services/toast-notification.service';
import { ToastNotificationComponent } from '../toast-notification/toast-notification';
import type { ToastNotification } from '../../services/toast-notification.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, ToastNotificationComponent],
  template: `
    <div class="toast-container">
      <app-toast-notification
        *ngFor="let notification of notifications"
        [show]="true"
        [message]="notification.message"
        [type]="notification.type"
        [duration]="notification.duration"
        (close)="onClose(notification.id)">
      </app-toast-notification>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    }

    app-toast-notification {
      pointer-events: auto;
    }
  `]
})
export class ToastContainerComponent implements OnInit, OnDestroy {
  notifications: ToastNotification[] = [];
  private subscription?: Subscription;

  constructor(private toastService: ToastNotificationService) {}

  ngOnInit(): void {
    this.subscription = this.toastService.notifications$.subscribe(notifications => {
      this.notifications = notifications;
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  onClose(id: string): void {
    this.toastService.remove(id);
  }
}

