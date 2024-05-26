import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private httpClient: HttpClient) { }

  getUser(githubUsername: string, page: number, perPage: number): Observable<any[]> {
    const url = `https://api.github.com/users/${githubUsername}/repos?page=${page}&per_page=${perPage}`;
    return this.httpClient.get<any[]>(url);
  }

  getUserReposCount(githubUsername: string): Observable<any> {
    const url = `https://api.github.com/users/${githubUsername}`;
    return this.httpClient.get<any>(url);
  }

  getLanguages(languageUrl: string): Observable<any> {
    return this.httpClient.get<any>(languageUrl);
  }
}
