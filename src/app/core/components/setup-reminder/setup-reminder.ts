import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

export interface SetupTask {
  key: string;
  path: string;
  complete: boolean;
}

@Component({
  imports: [RouterLink, TranslatePipe],
  selector: 'app-setup-reminder',
  styleUrl: './setup-reminder.scss',
  templateUrl: './setup-reminder.html',
})
export class SetupReminder {
  readonly petName = input.required<string>();
  readonly tasks = input.required<SetupTask[]>();
  readonly hasIncompleteTasks = computed(() => this.tasks().some((task) => !task.complete));
}
