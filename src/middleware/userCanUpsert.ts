import {
    RequestDto,
    Request,
    Response,
    NextFunction,
} from '../dtos/RequestDto';
import { EAllowedOperations } from '../models/EAllowedOperations';
import canPerform from './canPerform';

// ---------------------------------------------------------------------------
// Middleware authorization function that requires the user to have access to
// product upsert operation permission
// ---------------------------------------------------------------------------

export default function userCanUpsert(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    canPerform(
        req as RequestDto,
        res,
        next,
        EAllowedOperations.UserUpsert,
        'Forbidden upserting users'
    );
}
