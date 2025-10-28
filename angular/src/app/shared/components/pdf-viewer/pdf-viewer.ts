import { Component, Input, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

declare var pdfjsLib: any;

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pdf-viewer.html',
  styleUrls: ['./pdf-viewer.scss']
})
export class PdfViewerComponent implements OnInit, AfterViewInit {
  @Input() pdfUrl: string = '';
  @Input() scale: number = 1.0;
  
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef;
  @ViewChild('textLayer', { static: false }) textLayerRef!: ElementRef;
  
  private pdfDoc: any;
  private pageNum: number = 1;
  
  ngOnInit() {
    // Load pdf.js library
    if (typeof window !== 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        this.loadPdf();
      };
      document.head.appendChild(script);
    }
  }
  
  ngAfterViewInit() {
    if (this.pdfUrl) {
      this.loadPdf();
    }
  }
  
  async loadPdf() {
    if (!this.pdfUrl) return;
    
    // Wait for pdfjsLib to be loaded
    if (!pdfjsLib) {
      await new Promise(resolve => {
        const checkInterval = setInterval(() => {
          if (pdfjsLib) {
            clearInterval(checkInterval);
            resolve(null);
          }
        }, 100);
        
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve(null);
        }, 10000);
      });
    }
    
    if (!pdfjsLib) {
      console.error('pdfjsLib not loaded');
      return;
    }
    
    try {
      const loadingTask = pdfjsLib.getDocument(this.pdfUrl);
      this.pdfDoc = await loadingTask.promise;
      this.renderPage(this.pageNum);
    } catch (error) {
      console.error('Error loading PDF:', error);
    }
  }
  
  async renderPage(num: number) {
    if (!this.pdfDoc || !this.canvasRef || !this.textLayerRef) return;
    
    try {
      const page = await this.pdfDoc.getPage(num);
      const viewport = page.getViewport({ scale: this.scale });
      
      const canvas = this.canvasRef.nativeElement;
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
      
      // Render text layer
      const textContent = await page.getTextContent();
      this.renderTextLayer(textContent, viewport);
    } catch (error) {
      console.error('Error rendering page:', error);
    }
  }
  
  renderTextLayer(textContent: any, viewport: any) {
    const textLayerDiv = this.textLayerRef.nativeElement;
    textLayerDiv.innerHTML = '';
    
    textContent.items.forEach((item: any) => {
      const tx = item.transform;
      const span = document.createElement('span');
      span.textContent = item.str;
      span.style.left = item.transform[4] + 'px';
      span.style.top = item.transform[5] + 'px';
      span.style.fontSize = item.height + 'px';
      span.style.fontFamily = item.fontName;
      span.style.transform = `matrix(${tx[0]}, ${tx[1]}, ${tx[2]}, ${tx[3]}, 0, 0)`;
      textLayerDiv.appendChild(span);
    });
  }
}

