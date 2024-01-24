import mongoose from 'mongoose';
import AppLogger from './utils/Logger';
import { AppEnv, Env } from './utils/AppEnv';
const logger = new AppLogger(module);

declare type DbSuccessCallback = (db: mongoose.Connection) => void;

/**
 * When strict option is set to true, Mongoose will ensure that only the 
 * fields that are specified in your Schema will be saved in the database,
 * and all other fields will not be saved (if some other fields are sent).
 * 
 * Right now, this option is enabled by default, but it will be changed
 * in Mongoose v7 to false by default. That means that all the fields will
 * be saved in the database, even if some of them are not specified in the
 * Schema model.

 * So, if you want to have strict Schemas and store in the database only
 * what is specified in you model, starting with Mongoose v7, you will
 * have to set strict option to true manually.
 */
export async function InitDatabase(callback: DbSuccessCallback): Promise<void> {
    /*
    https://mongoosejs.com/docs/connections.html

    const MONGO_OPTIONS = {
        autoIndex: false, // Don't build indexes
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        family: 4 // Use IPv4, skip trying IPv6
    };
    */

    return new Promise((resolve, reject) => {
        mongoose.set('strictQuery', false);

        const dbUri = AppEnv.Get(Env.MONGODB_URL);
        logger.info(`Attempting DB connection to ${dbUri}`);

        try {
            mongoose.connect(dbUri);
        } catch (err) {
            process.exit(1);
        }

        const dbConnection = mongoose.connection;
        dbConnection.once('open', (_) => {
            console.log(`Database connected: ${dbUri}`);
            callback(dbConnection);
            resolve();
        });

        dbConnection.on('error', (err) => {
            const msg = `Could not connected to ${dbUri}`;
            logger.error(msg, err);
            //throw new Error(msg);
            reject();
        });
    });
}
