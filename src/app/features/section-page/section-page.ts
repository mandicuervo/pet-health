import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  imports: [TranslatePipe],
  selector: 'app-section-page',
  styleUrl: './section-page.scss',
  templateUrl: './section-page.html',
})
export class SectionPage {
  private readonly route = inject(ActivatedRoute);
  private readonly routeData = toSignal(this.route.data, {
    initialValue: this.route.snapshot.data,
  });

  readonly titleKey = computed(() => this.routeData()['titleKey'] as string);
  readonly descriptionKey = computed(
    () => this.routeData()['descriptionKey'] as string,
  );
}
