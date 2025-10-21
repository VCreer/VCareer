import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FooterLinkColumnComponent } from '../../shared/components/footer/footer-link-column/footer-link-column.component';
import { FooterContactComponent } from '../../shared/components/footer/footer-contact/footer-contact.component';
import { FooterSocialComponent } from '../../shared/components/footer/footer-social/footer-social.component';
import { FooterService } from '../../proxy/api/footer.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, FooterLinkColumnComponent, FooterContactComponent, FooterSocialComponent],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
  hotline = '(024) 6680 5588';
  email = 'hotro@vcareer.vn';
  columns: { title: string; links: { label: string; url: string }[] }[] = [];
  socialLinks: { icon: string; url: string; label: string }[] = [];

  constructor(private footerService: FooterService) {}

  ngOnInit(): void {
    this.footerService.getFooter().subscribe(data => {
      this.columns = data.columns;
      this.socialLinks = data.socialLinks;
      this.hotline = data.contact.hotline;
      this.email = data.contact.email;
    });
  }
}


