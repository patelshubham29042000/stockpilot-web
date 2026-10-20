import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

type Params = Record<string, string | number | boolean | null | undefined>;

/** The ONE place that calls HttpClient. Every page uses these methods. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private readonly base = '/api';

  get<T = any>(path: string, params?: Params): Observable<T> {
    return this.http.get<T>(this.url(path), { params: this.toParams(params) });
  }
  post<T = any>(path: string, body: unknown = {}): Observable<T> {
    return this.http.post<T>(this.url(path), body);
  }
  put<T = any>(path: string, body: unknown): Observable<T> {
    return this.http.put<T>(this.url(path), body);
  }
  delete<T = any>(path: string): Observable<T> {
    return this.http.delete<T>(this.url(path));
  }
  upload<T = any>(path: string, file: File): Observable<T> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<T>(this.url(path), form);
  }
  download(path: string, fileName: string): void {
    this.http.get(this.url(path), { responseType: 'blob' }).subscribe(blob => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(link.href);
    });
  }

  private url(path: string): string {
    return this.base + (path.startsWith('/') ? path : '/' + path);
  }
  private toParams(params?: Params): HttpParams {
    let result = new HttpParams();
    for (const [key, value] of Object.entries(params ?? {})) {
      if (value !== null && value !== undefined) result = result.set(key, String(value));
    }
    return result;
  }
}

/** One common way to turn a failed request into a message for the user. */
export const errMsg = (e: HttpErrorResponse): string =>
  e.error?.message ?? (e.status === 403 ? 'You do not have permission.' : 'Something went wrong. Try again.');
