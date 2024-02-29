export class JwtPayload {
    constructor(public readonly userId: string, public readonly serviceOperationIds: string[], public readonly audit: boolean) {}

    isOperationAllowed(operationId: string): boolean {
        var res = this.serviceOperationIds.find((element) => element === operationId);

        return res !== undefined ? true : false;
    }
}
