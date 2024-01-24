import { Request } from 'express';
import { JwtPayload } from '../models/JwtPayload';

export { Request, Response, NextFunction } from 'express';
// ----------------------------------------------------------------

export interface RequestDto extends Request {
    Jwt: JwtPayload;
}
