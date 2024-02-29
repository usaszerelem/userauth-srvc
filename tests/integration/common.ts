import mongoose from 'mongoose';
import { ServerInit } from '../../src/startup/serverInit';
import { Server } from 'http';
import express, { Express } from 'express';
import { User } from '../../src/models/users';

const app: Express = express();

export interface StartupReturn {
    server: Server | null;
    adminId: mongoose.Types.ObjectId;
    adminAuthToken: string;
}

export async function Startup(): Promise<StartupReturn> {
    await ServerInit(app);

    //console.log('ServerInit() should be completed.');

    let retObj: StartupReturn = {
        server: null,
        adminId: new mongoose.Types.ObjectId(),
        adminAuthToken: '',
    };

    //console.log('Asking server to listen on port 3001');
    retObj.server = app.listen(3001, async () => {});
    //console.log('Server should be listening on port 3001. Server object is: ' + retObj.server);

    const superUser = new User({
        _id: retObj.adminId,
        isActive: true,
        firstName: 'Super',
        lastName: 'Duper',
        email: 'super.duper@gmail.com',
        password: '$2b$10$7/HXCoDwlsl6aC3n7R0ez.RLLRSc19YVKyNcxilnmGOPhxyVRZrtC',
        operations: ['UserUpsert', 'UserDelete', 'UserList', 'ProdUpsert', 'ProdDelete', 'ProdList'],
        audit: true,
    });

    //console.log('Creating super user');

    await superUser.save();
    //retObj.adminAuthToken = generateAuthToken(superUser!);
    //console.log('Super user created.');

    return retObj;
}

export async function Shutdown(server: Server | null): Promise<void> {
    await User.deleteMany({})
        .then(async function () {})
        .catch(function (_error: any) {
            //console.log(error);
        });

    if (server !== null) {
        server.close();
    }
}
