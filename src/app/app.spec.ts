import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { DashboardPage } from './features/dashboard/dashboard-page/dashboard-page';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should use the dashboard as the default route', () => {
    expect(routes[0]).toEqual({ path: '', component: DashboardPage });
  });
});
