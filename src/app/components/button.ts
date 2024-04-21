import { Component } from '@angular/core';

@Component({
  selector: 'my-button',
  templateUrl: './button.html',
  styleUrls: ['./button.scss'],
  standalone: true,
})
export class MyButton {
  handleClick() {
    console.log('click');
  }

  handleMouseover() {
    console.log('mouse over');
  }
}

// npm i matter-js
// npm i -D @types/matter-js
