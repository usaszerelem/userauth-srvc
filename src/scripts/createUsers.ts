import mongoose from 'mongoose';
import { InitDatabase } from '../startup/database';
import { createUsers } from '../startup/utils/createUsers';

createWrapper();

function createWrapper() {
    InitDatabase(DbSuccessCallback).then(() => console.log('Users created'));
}

async function DbSuccessCallback(db: mongoose.Connection): Promise<void> {
    return new Promise(async (resolve, reject) => {
        try {
            await createUsers();
            db.close();
            resolve();
        } catch (ex) {
            reject();
        } finally {
            console.log('Exiting process');
            process.exit();
        }
    });
}
