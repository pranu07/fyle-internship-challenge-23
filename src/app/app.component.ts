import { Component, OnInit } from '@angular/core';
import { ApiService } from './services/api.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  repos: any[] = [];
  currentPage = 1;
  perPage = 10;
  username = '';
  totalReposCount = 0;
  languages: any[] = [];
  isSearching = false;
  noRepos = false;
  hasMoreRepos = true;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    // Do not search by default, wait for user input
  }

  searchUser(username: string) {
    if (username) {
      this.isSearching = true;
      this.noRepos = false;
      this.username = username;

      this.apiService.getUserReposCount(username).subscribe(userData => {
        this.totalReposCount = userData.public_repos;
        // Update hasMoreRepos flag based on whether there are more repositories than the current page size allows
        this.hasMoreRepos = this.totalReposCount > this.perPage;
      });

      this.apiService.getUser(username, this.currentPage, this.perPage).pipe(
        catchError(error => {
          if (error.status === 404) {
            alert('Username not found. Please enter a valid username.');
            this.isSearching = false;
            this.repos = [];
            this.noRepos = false;
            return of([]);
          }
          this.isSearching = false;
          this.noRepos = false;
          return of([]);
        })
      ).subscribe(repos => {
        this.repos = repos;
        this.isSearching = false;
        if (this.repos.length === 0 && !this.noRepos) {
          this.noRepos = true;
        } else {
          this.noRepos = false;
          this.hasMoreRepos = (this.currentPage * this.perPage) < this.totalReposCount;
        }
        this.loadLanguagesForRepos();
      });
    }
  }

  changePageSize() {
    this.currentPage = 1;
    this.searchUser(this.username);
    // Update hasMoreRepos flag based on whether there are more repositories than the new page size allows
    this.hasMoreRepos = this.totalReposCount > this.perPage;
  }

  goToPage(page: number) {
    if (page < 1) return;
    this.currentPage = page;
    this.searchUser(this.username);
  }

  loadLanguagesForRepos() {
    this.languages = [];
    this.repos.forEach((repo, index) => {
      if (repo.languages_url) {
        this.apiService.getLanguages(repo.languages_url).subscribe(languages => {
          this.languages[index] = {
            repoName: repo.name,
            languages: Object.keys(languages)
          };
        });
      }
    });
  }
}
