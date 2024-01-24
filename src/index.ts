import express, { Express } from 'express';
import fs from 'fs';
import AppLogger from './startup/utils/Logger';
import { Server as HttpServer } from 'http';
import https, { Server as HttpsServer } from 'https';
import { ServerInit } from './startup/serverInit';
import parseBool from './startup/utils/parseBool';
import { AppEnv, Env } from './startup/utils/AppEnv';
import { InitSwaggerDoc } from './startup/routes';

const logger = new AppLogger(module);
const app: Express = express();

var server: HttpServer<any, any> | HttpsServer<any, any> | undefined = undefined;

type AddressInfo = {
    address: string;
    family: string;
    port: number;
};

try {
    ServerInit(app);

    const port = parseInt(AppEnv.Get(Env.PORT));
    const isHttps = parseBool(AppEnv.Get(Env.USE_HTTPS));

    if (isHttps === false) {
        server = app.listen(port, () => {});
    } else {
        var serverSslOptions = {
            rejectUnauthorized: false,
            key: fs.readFileSync('./ssl/key.pem'),
            cert: fs.readFileSync('./ssl/cert.pem'),
            //ca: fs.readFileSync('./ssl/ca.crt'),
            //requestCert: true
        };

        var httpSrv = https.createServer(serverSslOptions, app);
        server = httpSrv.listen(port, () => {});
    }

    const listeningUrl = serverListening(server.address() as AddressInfo, isHttps);
    logger.info(`Listening on ${listeningUrl}`);
    InitSwaggerDoc(app, listeningUrl);
} catch (ex) {
    if (ex instanceof Error) {
        logger.error(ex.message);
    } else {
        logger.error('Fatal exception. Service terminated');
    }
}
/**
 * Logs information about the server's connection
 * @param addrInfo - information returned from listen()
 * @param isHttps - 'true' if secure connection
 */

function serverListening(addrInfo: AddressInfo, isHttps: boolean = false): string {
    if (addrInfo?.address === '::') {
        addrInfo.address = 'localhost';
    }

    if (isHttps === true) {
        return `https://${addrInfo.address}:${addrInfo.port}`;
    } else {
        return `http://${addrInfo.address}:${addrInfo.port}`;
    }
}

export default server;
