import { RequestDto, Response, NextFunction } from '../dtos/RequestDto';
import AppLogger from '../startup/utils/Logger';

const logger = new AppLogger(module);

export default function canPerform(req: RequestDto, res: Response, next: NextFunction, serviceOpId: string, msg: string): void {
    try {
        const reqDto = req as RequestDto;

        if (reqDto.Jwt.isOperationAllowed(serviceOpId) === false) {
            logger.error(msg);
            res.status(403).send(msg);
        } else {
            next();
        }
    } catch (ex) {
        if (ex instanceof Error) {
            msg = ex.message;
        }

        logger.error(msg);
        res.status(500).send(msg);
    }
}
