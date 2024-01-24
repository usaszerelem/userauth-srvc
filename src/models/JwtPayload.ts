import { EAllowedOperations } from './EAllowedOperations';

export class JwtPayload {
    constructor(
        public readonly userId: string,
        public readonly operations: string[],
        public readonly audit: boolean
    ) {}

    isOperationAllowed(operation: EAllowedOperations): boolean {
        var res = this.operations.find((element) => element === operation);

        return res !== undefined ? true : false;
    }
}
