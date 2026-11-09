import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { SetupReminder } from './setup-reminder';

describe('SetupReminder', () => {
  let fixture: ComponentFixture<SetupReminder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SetupReminder],
      providers: [provideRouter([]), provideTranslateService({ lang: 'en', fallbackLang: 'en' })],
    }).compileComponents();

    fixture = TestBed.createComponent(SetupReminder);
    fixture.componentRef.setInput('petName', 'Falafel');
  });

  it('shows incomplete tasks', async () => {
    fixture.componentRef.setInput('tasks', [
      { key: 'dashboard.setupWeight', path: '/weight', complete: false },
    ]);

    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.setup-reminder')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('a')).toHaveLength(1);
  });

  it('hides when there are no incomplete tasks', async () => {
    fixture.componentRef.setInput('tasks', [
      { key: 'dashboard.setupWeight', path: '/weight', complete: true },
    ]);

    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.setup-reminder')).toBeNull();
  });
});
