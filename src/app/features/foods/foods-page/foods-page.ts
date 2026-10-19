import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  imports: [TranslatePipe],
  selector: 'app-foods-page',
  styleUrl: './foods-page.scss',
  templateUrl: './foods-page.html',
})
export class FoodsPage {
  readonly titleKey = 'navigation.foods';
  readonly descriptionKey = 'pages.foodsDescription';
}
