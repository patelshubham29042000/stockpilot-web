import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { catchError, tap, throwError } from 'rxjs';
import { Notify } from '../notify/notify.service';
import { Auth } from './auth.service';

/** Plain-words explanation when the server cannot be reached (null = a normal error the page handles). */
const connectionMessage = (e: HttpErrorResponse): string | null => {
  if (e.status === 0) return 'Cannot reach the server. Check that the backend is running (scripts/dev.sh).';
  if (e.status === 502 || e.status === 503 || e.status === 504) return 'A service is not responding. Check the backend terminal for errors and that the database is running.';
  if (e.status === 500) return 'The server hit an error. Check the backend terminal.';
  if (e.status === 200 && typeof e.error?.text === 'string' && e.error.text.trimStart().startsWith('<'))
    return 'The app is not connected to the API. Start Angular with: npx ng serve --proxy-config proxy.conf.json';
  return null;
};

/** Adds the JWT to every request, logs out on 401 and shows a banner when the server cannot be reached. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  const notify = inject(Notify);
  const token = auth.token();
  const request = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  const isLogin = req.url.includes('/auth/login');

  return next(request).pipe(
    tap(event => { if (event instanceof HttpResponse) notify.clear(); }),
    catchError((e: HttpErrorResponse) => {
      if (e.status === 401 && !isLogin) auth.logout();
      else if (!isLogin) { const text = connectionMessage(e); if (text) notify.show(text); }
      return throwError(() => e);
    }));
};
