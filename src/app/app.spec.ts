import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { App } from './app';
import { DashboardPage } from './features/dashboard/dashboard-page/dashboard-page';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
      ],
    })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should use the dashboard as the default route', () => {
    expect(routes[0].path).toBe('');
    expect(routes[0].component).toBe(DashboardPage);
    expect(routes[0].canActivate).toBeDefined();
  });

  it('should provide routes for each section in the navigation', () => {
    expect(routes.map(({ path }) => path)).toEqual([
      '',
      'welcome',
      'login',
      'register',
      'setup',
      'weight',
      'records/new',
      'food-diary',
      'foods',
      'profile',
      'profile/customization',
      '**',
    ]);
  });

  it('should expose welcome, login, and registration as separate public screens', () => {
    expect(routes.find(({ path }) => path === 'welcome')?.data).toEqual({
      authMode: 'welcome',
    });
    expect(routes.find(({ path }) => path === 'login')?.data).toEqual({
      authMode: 'login',
    });
    expect(routes.find(({ path }) => path === 'register')?.data).toEqual({
      authMode: 'register',
    });
  });
});
