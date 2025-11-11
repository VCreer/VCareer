import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-employee-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './employee-home.html',
  styleUrls: ['./employee-home.scss']
})
export class EmployeeHomeComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}

