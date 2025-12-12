import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'amount',
  standalone: true
})
export class AmountPipe implements PipeTransform {
  transform(value: number | string | null): string {
    if (value === null || value === undefined) {
      return '0.00';
    }
    
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) {
      return '0.00';
    }
    
    const formatted = numValue.toFixed(2);
    return numValue === 0 ? formatted : formatted.replace(/^0+/, '');
  }
} 