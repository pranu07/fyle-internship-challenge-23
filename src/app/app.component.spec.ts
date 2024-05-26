import { TestBed, ComponentFixture } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { ApiService } from './services/api.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { FormsModule } from '@angular/forms';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let app: AppComponent;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['getUser', 'getUserReposCount', 'getLanguages']);
    TestBed.configureTestingModule({
      declarations: [AppComponent],
      imports: [HttpClientTestingModule, FormsModule],
      providers: [{ provide: ApiService, useValue: apiSpy }]
    });

    fixture = TestBed.createComponent(AppComponent);
    app = fixture.componentInstance;
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  it('should create the app', () => {
    expect(app).toBeTruthy();
  });

  it('should have initial state', () => {
    expect(app.repos.length).toBe(0);
    expect(app.currentPage).toBe(1);
    expect(app.perPage).toBe(10);
    expect(app.username).toBe('');
    expect(app.totalReposCount).toBe(0);
    expect(app.languages.length).toBe(0);
    expect(app.isSearching).toBe(false);
    expect(app.noRepos).toBe(false);
    expect(app.hasMoreRepos).toBe(true);
  });

  it('should search user and handle no repos', () => {
    const username = 'testuser';
    apiService.getUserReposCount.and.returnValue(of({ public_repos: 0 }));
    apiService.getUser.and.returnValue(of([]));

    app.searchUser(username);

    expect(apiService.getUserReposCount).toHaveBeenCalledWith(username);
    expect(apiService.getUser).toHaveBeenCalledWith(username, app.currentPage, app.perPage);
    expect(app.isSearching).toBe(false);
    expect(app.noRepos).toBe(true);
  });

  it('should search user and handle repos', () => {
    const username = 'testuser';
    const repos = [{ name: 'repo1', description: 'desc1', languages_url: '' }];
    apiService.getUserReposCount.and.returnValue(of({ public_repos: 1 }));
    apiService.getUser.and.returnValue(of(repos));

    app.searchUser(username);

    expect(apiService.getUserReposCount).toHaveBeenCalledWith(username);
    expect(apiService.getUser).toHaveBeenCalledWith(username, app.currentPage, app.perPage);
    expect(app.isSearching).toBe(false);
    expect(app.repos).toEqual(repos);
    expect(app.noRepos).toBe(false);
    expect(app.hasMoreRepos).toBe(false);
  });

  it('should handle user not found error', () => {
    const username = 'invaliduser';
    apiService.getUserReposCount.and.returnValue(throwError({ status: 404 }));
    apiService.getUser.and.returnValue(throwError({ status: 404 }));

    spyOn(window, 'alert');

    app.searchUser(username);

    expect(apiService.getUserReposCount).toHaveBeenCalledWith(username);
    expect(apiService.getUser).toHaveBeenCalledWith(username, app.currentPage, app.perPage);
    expect(window.alert).toHaveBeenCalledWith('Username not found. Please enter a valid username.');
    expect(app.isSearching).toBe(false);
    expect(app.repos).toEqual([]);
    expect(app.noRepos).toBe(true); // Updated assertion
  });

  it('should change page size and update results', () => {
    const username = 'testuser';
    const repos = Array.from({ length: 20 }, (_, i) => ({ name: `repo${i + 1}`, description: `desc${i + 1}`, languages_url: '' }));
    apiService.getUserReposCount.and.returnValue(of({ public_repos: 20 }));
    apiService.getUser.and.returnValue(of(repos.slice(0, 10)));

    app.perPage = 10;
    app.searchUser(username);

    expect(apiService.getUser).toHaveBeenCalledWith(username, app.currentPage, 10);
    expect(app.repos.length).toBe(10);

    apiService.getUser.and.returnValue(of(repos));

    app.perPage = 20;
    app.changePageSize();

    expect(apiService.getUser).toHaveBeenCalledWith(username, app.currentPage, 20);
    expect(app.repos.length).toBe(20);
  });

  it('should handle pagination', () => {
    const username = 'testuser';
    const repos = Array.from({ length: 30 }, (_, i) => ({ name: `repo${i + 1}`, description: `desc${i + 1}`, languages_url: '' }));
    apiService.getUserReposCount.and.returnValue(of({ public_repos: 30 }));
    apiService.getUser.and.returnValue(of(repos.slice(0, 10)));

    app.perPage = 10;
    app.searchUser(username);

    expect(app.currentPage).toBe(1);
    expect(app.hasMoreRepos).toBe(true);

    apiService.getUser.and.returnValue(of(repos.slice(10, 20)));
    app.goToPage(2);

    expect(app.currentPage).toBe(2);
    expect(app.hasMoreRepos).toBe(true);

    apiService.getUser.and.returnValue(of(repos.slice(20, 30)));
    app.goToPage(3);

    expect(app.currentPage).toBe(3);
    expect(app.hasMoreRepos).toBe(false);
  });
});
