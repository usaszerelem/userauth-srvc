import { RequestDto, Request, Response, NextFunction } from '../dtos/RequestDto';
import { AppEnv, Env } from '../startup/utils/AppEnv';

import canPerform from './canPerform';

// ---------------------------------------------------------------------------
// Middleware authorization function that requires the user to have access to
// product upsert operation permission
// ---------------------------------------------------------------------------

export default function userCanDelete(req: Request, res: Response, next: NextFunction): void {
    canPerform(req as RequestDto, res, next, AppEnv.Get(Env.SRVCID_USER_DELETE), 'Forbidden upserting users');
}
