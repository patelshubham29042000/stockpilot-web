import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from './auth.service';

/** guard() = must be signed in.  guard(PERM.itemsManage) = must also have that permission (any one of several). */
export const guard = (...permissions: string[]): CanActivateFn => () => {
  const auth = inject(Auth);
  const router = inject(Router);
  if (!auth.isLoggedIn()) return router.parseUrl('/login');
  return auth.can(...permissions) ? true : router.parseUrl(auth.homePath());
};
