import AppLogger from './utils/Logger';
const logger = new AppLogger(module);

export function OnUnhandledErrors() {
    /*
    [`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `SIGTERM`].forEach((eventType) => {
        process.on(eventType, cleanUpServer.bind(null, eventType));
    });
    */

    // -------------------------------------------------
    // Unhandled synchronous exception. To test:
    // throw new Error('Something crashed');

    process.on('uncaughtException', (ex) => {
        logger.error(ex.message, ex);
        process.exit(1);
    });

    // -------------------------------------------------
    // Unhandled asynchronous exception. To test:
    // const p = Promise.reject(new Error('Something failed miserably.'));
    // p.then(() => console.log('Done'));
    process.on('unhandledRejection', (ex: Error) => {
        logger.error(ex.message, ex);
        process.exit(1);
    });
}
