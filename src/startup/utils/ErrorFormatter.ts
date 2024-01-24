interface TechnoBabbelToUserFriendly {
    keyStr: string; // Substring to find in the system message
    httpStatus: number;
    userFriendly: string; // If found, return this user friendly message
}

export function ErrorToUserFriendly(systemError: string): [number, string] {
    let httpStatus = 500;
    let userFriendly = systemError;

    const msgMap: TechnoBabbelToUserFriendly[] = [
        {
            keyStr: 'duplicate key error collection',
            httpStatus: 409,
            userFriendly: 'There is already a product with this UPC in the database.',
        },
    ];

    const babble = msgMap.find((e) => systemError.indexOf(e.keyStr) !== -1);

    if (babble !== undefined) {
        httpStatus = babble.httpStatus;
        userFriendly = babble.userFriendly;
    }

    return [httpStatus, userFriendly];
}

export function ErrorFormatter(msg: string, ex: any, file: string): string {
    const excpMsg = ex instanceof Error ? ex.message : '';

    let idx = file.lastIndexOf('/');
    file = file.substring(idx + 1);

    if (excpMsg.length > 0) {
        return `${msg}, File: ${file}. Error: ${excpMsg}`;
    } else {
        return `${msg} in ${file}`;
    }
}
