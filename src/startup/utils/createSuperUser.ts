import mongoose from 'mongoose';
import IUserDto from '../../dtos/IUserDto';
import { User } from '../../models/users';
import { InitDatabase } from '../database';
import AppLogger from './Logger';
const logger = new AppLogger(module);

async function DbSuccessCallback(db: mongoose.Connection): Promise<void> {
    logger.info('Database initialized. Creating super user');

    let usr: IUserDto = {
        isActive: true,
        firstName: 'Super',
        lastName: 'User',
        email: 'super.user@gmail.com',
        password: '$2b$10$7/HXCoDwlsl6aC3n7R0ez.RLLRSc19YVKyNcxilnmGOPhxyVRZrtC',
        roleIds: [''],
        serviceOperationIds: [''],
        audit: true,
    };

    if ((await userExists(usr.email)) == false) {
        let user = new User(usr);
        user = await user.save();
        logger.info('super user created');
        //logger.debug(user);
    } else {
        logger.warn('super user exists.');
    }

    logger.info('Closing DB and exiting process.');
    db.close();
    process.exit(1);
}

export async function createSuperUser(): Promise<void> {
    try {
        await InitDatabase(DbSuccessCallback);
    } catch (ex) {
        logger.error('Database initialization failed.');
    } finally {
        logger.info('Database initialization returned.');
    }
}

async function userExists(email: string): Promise<boolean> {
    return (await User.findOne({ email: email })) !== null ? true : false;
}
