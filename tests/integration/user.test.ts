import mongoose from 'mongoose';
import request from 'supertest';
import { User, generateAuthToken } from '../../src/models/users';
import jwt from 'jsonwebtoken';
import JwtPayloadDto from '../../src/dtos/JwtPayloadDto';
import IUserDto from '../../src/dtos/IUserDto';
import { StartupReturn, Startup, Shutdown } from './common';
import { AppEnv, Env } from '../../src/startup/utils/AppEnv';

describe('/api/users', () => {
    let testData: StartupReturn;

    var _startup = async function () {
        testData = await Startup();
    };

    var _shutdown = async function () {
        await Shutdown(testData.server);
    };

    describe('Admin User Validation', () => {
        beforeAll(_startup);
        afterAll(_shutdown);

        it('should decode super user token', async () => {
            expect(testData.adminAuthToken).toBeTruthy();

            const decoded = jwt.verify(testData.adminAuthToken, AppEnv.Get(Env.JWT_PRIVATE_KEY)) as JwtPayloadDto;

            expect(decoded.operations).toEqual(
                expect.arrayContaining(['UserUpsert', 'UserDelete', 'UserList', 'ProdUpsert', 'ProdDelete', 'ProdList'])
            );

            expect(decoded.audit).toBe(true);
        });

        describe('Regular User Validation', () => {
            let userId: mongoose.Types.ObjectId;
            let userAuthToken: string = '';

            var _beforeEach = async function () {
                // Create regular user
                userId = new mongoose.Types.ObjectId();

                let user = new User({
                    _id: userId,
                    isActive: true,
                    firstName: 'Mickey',
                    lastName: 'Mouse',
                    email: 'mickey.mouse@disney.com',
                    password: 'abcdefg',
                    audit: true,
                    operations: ['UserList', 'ProdList'],
                });

                user = await user.save();
                userAuthToken = generateAuthToken(user!);
                expect(userAuthToken).toBeTruthy();
            };

            var _afterEach = async function () {
                // Delete regular user
                await User.deleteOne({ _id: userId });
            };

            beforeEach(_beforeEach);
            afterEach(_afterEach);

            it('Should decode regular user token', async () => {
                expect(userAuthToken).toBeTruthy();

                const decoded = jwt.verify(userAuthToken, AppEnv.Get(Env.JWT_PRIVATE_KEY)) as JwtPayloadDto;

                expect(decoded.operations).toEqual(expect.arrayContaining(['UserList', 'ProdList']));
                expect(decoded.audit).toBe(true);
            });

            it('Should retreive reguler user by email address', async () => {
                const res = await request(testData.server)
                    .get('/api/v1/users')
                    .set('x-auth-token', userAuthToken)
                    .query({ email: 'mickey.mouse@disney.com' });

                expect(res.status).toBe(200);
                const user = res.body as IUserDto;

                expect(user).toHaveProperty('_id');
                expect(user).toHaveProperty('isActive');
                expect(user).toHaveProperty('firstName');
                expect(user).toHaveProperty('lastName');
                expect(user).toHaveProperty('email');
                expect(user).toHaveProperty('operations');
                expect(user).toHaveProperty('audit');
                expect(user).toHaveProperty('createdAt');
                expect(user).toHaveProperty('updatedAt');

                expect(user.operations).toEqual(expect.arrayContaining(['UserList', 'ProdList']));
            });

            it('Should retreive regular user by user ID', async () => {
                const strUserId = userId.toString();

                const res = await request(testData.server)
                    .get('/api/v1/users')
                    .set('x-auth-token', userAuthToken)
                    .query({ entityId: strUserId });

                expect(res.status).toBe(200);

                const user = res.body as IUserDto;

                expect(user).toHaveProperty('_id');
                expect(user).toHaveProperty('isActive');
                expect(user).toHaveProperty('firstName');
                expect(user).toHaveProperty('lastName');
                expect(user).toHaveProperty('email');
                expect(user).toHaveProperty('operations');
                expect(user).toHaveProperty('audit');
                expect(user).toHaveProperty('createdAt');
                expect(user).toHaveProperty('updatedAt');

                expect(user.operations).toEqual(expect.arrayContaining(['UserList', 'ProdList']));
            });
        });
    });
});
