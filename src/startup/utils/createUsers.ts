import * as fs from 'fs';
import path from 'path';
import { User, validateUser } from '../../models/users';
import IUserDto from '../../dtos/IUserDto';
import AppLogger from './Logger';
import { RouteErrorFormatter } from './RouteHandlingError';

const logger = new AppLogger(module);

async function userExists(email: string): Promise<boolean> {
    return (await User.findOne({ email: email })) !== null ? true : false;
}

export async function createUsers(): Promise<void> {
    return new Promise(async (resolve, reject) => {
        const password = '$2b$10$7/HXCoDwlsl6aC3n7R0ez.RLLRSc19YVKyNcxilnmGOPhxyVRZrtC';

        try {
            const users = getDataJsonFile<IUserDto>('users.json');

            for (let idx = 0; idx < users.length; idx++) {
                if ((await userExists(users[idx].email)) == false) {
                    users[idx].password = 'invalidpsw';
                    users[idx].isActive = true;

                    validateUser(users[idx]);

                    users[idx].password = password;
                    let user = new User(users[idx]);
                    user = await user.save();
                    logger.info(`Saved: "${users[idx].email}"`);
                } else {
                    logger.info(`"${users[idx].email}" exists.`);
                }
            }

            resolve();
        } catch (ex) {
            const error = RouteErrorFormatter(ex, __filename, 'createUsers() Error');
            logger.error(error.message);

            reject();
        }
    });
}

/**
 * Reads the JSON file and parses it into an array of JSON objects
 * @param jsonFileName
 * @returns Array of JSON objects
 */
export function getDataJsonFile<T>(jsonFileName: string): T[] {
    let dataFileFullPath = __dirname;

    let idx = dataFileFullPath.lastIndexOf('/');
    dataFileFullPath = dataFileFullPath.substring(0, idx);

    dataFileFullPath = path.join(dataFileFullPath, 'scripts/' + jsonFileName);

    if (fs.existsSync(dataFileFullPath) === false) {
        throw new Error('Cannot find: ' + dataFileFullPath);
    }

    logger.info('Found file: ' + dataFileFullPath);
    logger.debug(dataFileFullPath);

    const jsonString = fs.readFileSync(dataFileFullPath, 'utf-8');
    const jsonData = JSON.parse(jsonString);

    return jsonData.data;
}
