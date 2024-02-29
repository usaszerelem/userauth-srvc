import { RequestDto, Request, Response, NextFunction } from '../dtos/RequestDto';
import jwt from 'jsonwebtoken';
import AppLogger from '../startup/utils/Logger';
import { JwtPayload } from '../models/JwtPayload';
import JwtPayloadDto from '../dtos/JwtPayloadDto';
import { AppEnv, Env } from '../startup/utils/AppEnv';

const logger = new AppLogger(module);

export function outputAuthTokenExpiration(token: string) {
    const decoded = jwt.verify(token, AppEnv.Get(Env.JWT_PRIVATE_KEY)) as JwtPayloadDto;

    const expiration = decoded.exp - decoded.iat;
    logger.debug(`Auth token TTL: ${expiration} seconds`);
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------

export default function userAuth(req: Request, res: Response, next: NextFunction): void {
    const token = req.header('x-auth-token');

    if (!token) {
        const msg = 'Access denied. No token provided.';
        logger.error(msg);
        res.status(401).send(msg);
    } else {
        try {
            const decoded = jwt.verify(token, AppEnv.Get(Env.JWT_PRIVATE_KEY)) as JwtPayloadDto;

            const expiration = decoded.exp - decoded.iat;
            logger.debug(`userAuth token TTL: ${expiration} seconds`);

            let request = req as RequestDto;
            request.Jwt = new JwtPayload(decoded.userId, decoded.serviceOperationIds, decoded.audit);
            next();
        } catch (ex: any | Error) {
            let msg = 'Invalid token.';

            if (ex.name === 'TokenExpiredError') {
                msg = 'Authentication token expired';
            }

            logger.debug(`Token: ${token}`);
            logger.error(msg);
            res.status(400).send(msg);
        }
    }
}
