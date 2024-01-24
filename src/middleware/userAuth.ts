import { RequestDto, Request, Response, NextFunction } from '../dtos/RequestDto';
import jwt from 'jsonwebtoken';
import AppLogger from '../startup/utils/Logger';
import { JwtPayload } from '../models/JwtPayload';
import JwtPayloadDto from '../dtos/JwtPayloadDto';
import { AppEnv, Env } from '../startup/utils/AppEnv';
import { ErrorFormatter } from '../startup/utils/ErrorFormatter';

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
            request.Jwt = new JwtPayload(decoded.userId, decoded.operations, decoded.audit);
            next();
        } catch (ex) {
            logger.debug(`Token: ${token}`);
            logger.error(ErrorFormatter('Fatal error', ex, __filename));
            res.status(400).send('Invalid token.');
        }
    }
}
