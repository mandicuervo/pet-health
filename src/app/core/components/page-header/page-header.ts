import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  imports: [RouterLink, TranslatePipe],
  selector: 'app-page-header',
  styleUrl: './page-header.scss',
  templateUrl: './page-header.html',
})
export class PageHeader {
  readonly eyebrowKey = input<string>();
  readonly eyebrowText = input<string>();
  readonly titleKey = input<string>();
  readonly titleText = input<string>();
  readonly titleParams = input<Record<string, unknown>>();
  readonly descriptionKey = input<string>();
  readonly descriptionText = input<string>();
  readonly descriptionParams = input<Record<string, unknown>>();
  readonly backLink = input<string>();
  readonly backLabelKey = input<string>();
  readonly hasActions = input(false);
}
