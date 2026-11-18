import { Component } from '@angular/core';import { RouterLink } from '@angular/router';import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
@Component({selector:'app-attendance-sheet',standalone:true,imports:[RouterLink,PageHeaderComponent],templateUrl:'./attendance-sheet.component.html',styleUrl:'./attendance-sheet.component.scss'})
export class AttendanceSheetComponent{}
