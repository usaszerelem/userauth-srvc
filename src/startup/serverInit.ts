import mongoose from 'mongoose';
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import AppLogger from './utils/Logger';
import { InitDatabase } from './database';
import { OnUnhandledErrors } from './unhandledExceptions';
import { InitRoutes } from './routes';
import { AppEnv, Env } from './utils/AppEnv';

const logger = new AppLogger(module);

async function DbSuccessCallback(_db: mongoose.Connection): Promise<void> {}

/**
 * Initializes service startup subsystems
 */
export async function ServerInit(expApp: Express): Promise<void> {
    logger.debug(`Log Level configured for: ` + AppEnv.Get(Env.LOG_LEVEL));
    logger.debug(`Console logging enabled: ` + AppEnv.Get(Env.CONSOLELOG_ENABLED));
    logger.debug(`File logging enabled: ` + AppEnv.Get(Env.FILELOG_ENABLED));
    logger.info('Service name: ' + AppEnv.Get(Env.SERVICE_NAME));
    logger.info('Loading: ./startup/prod');

    // https://www.npmjs.com/package/helmet
    expApp.use(helmet());

    // https://www.npmjs.com/package/compression
    expApp.use(compression());

    // The express.json() function is a middleware function used in Express.js
    // applications to parse incoming JSON data from HTTP requests. It is the
    // process of converting a JSON string to a JSON object for data manipulation.
    expApp.use(express.json());

    // Parses urlencoded bodies and only looks at requests where
    // 'Content-Type' header matches the type option.
    // This is a global option, but route specific middleware settings
    // can be created if needed.
    // extended: true indicates the algorithm complexity that should be
    // used to decode the encoded string
    // limit: specifies the upper limit in bytes for the payload. Default is 100K
    // parameterLimit: specified the max number of query parameters allowed.

    expApp.use(
        express.urlencoded({
            extended: true,
            limit: 6_000_000,
            parameterLimit: 3,
        })
    );

    expApp.use(cors());

    logger.info('Loading: ./startup/database');
    await InitDatabase(DbSuccessCallback);

    logger.info('Loading ./startup/unhandledExceptions');
    OnUnhandledErrors();

    logger.info('Loading: ./startup/routes');
    InitRoutes(expApp);
}
