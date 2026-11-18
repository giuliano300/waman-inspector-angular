import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-data-loader',
  standalone: true,
  templateUrl: './data-loader.component.html',
  styleUrl: './data-loader.component.scss'
})
export class DataLoaderComponent {
  @Input() label = 'Loading data';
  @Input() compact = false;
}
