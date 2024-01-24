import { Application } from 'express';
import users from '../routes/users';
import auth from '../routes/auth';
import otp from '../routes/otp';
import moment from 'moment';
import swaggerjsdoc from 'swagger-jsdoc';
import swaggerui from 'swagger-ui-express';
import { version } from '../../package.json';

export function InitRoutes(app: Application) {
    app.use(function (_req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'X-Requested-With');
        next();
    });

    app.use('/api/v1/users', users);
    app.use('/api/v1/auth', auth);
    app.use('/api/v1/otp', otp);

    // https://momentjs.com/docs/#/displaying/format/
    app.get('/', (_reg, res) => res.send(moment().format('dddd, MMMM Do YYYY, HH:mm:ss Z')));
    // app.get('/', (_reg, res) => res.send(moment().format('YYYY/MM/DDTHH:mm:ss Z')));
}

/**
 * This function initializes the Swagger documentation subsystem. All source files
 * in the routes and dtos directory are scanned for swagger documentation
 * @param app
 * @param serverUrl
 */
export function InitSwaggerDoc(app: Application, serverUrl: string) {
    const serviceTitle = 'Discounted Products Service';

    const options: swaggerjsdoc.Options = {
        failOnErrors: true, // Whether or not to throw when parsing errors. Defaults to false.
        definition: {
            openapi: '3.0.0',
            info: {
                title: serviceTitle,
                description: 'Service that manages discounted products.',
                termsOfService: 'https://www.martinware.com/en/terms-of-use',
                license: {
                    name: 'Software License',
                    url: 'https://www.martinware.com/en/terms-of-use',
                },
                version,
            },
            servers: [
                {
                    url: serverUrl,
                },
            ],
        },
        apis: ['./src/routes/*.ts', './src/dtos/*.ts'],
        info: {
            title: serviceTitle,
            version,
        },
    };

    const swaggerSpec = swaggerjsdoc(options);
    app.use('/api-docs', swaggerui.serve, swaggerui.setup(swaggerSpec));
}
