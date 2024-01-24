import winston from 'winston';
import { MongoDB, MongoDBConnectionOptions } from 'winston-mongodb';
import path from 'path';
import DailyRotateFile = require('winston-daily-rotate-file');
import parseBool from './parseBool';
import { AppEnv, Env } from './AppEnv';

const { combine, timestamp, printf, colorize, json } = winston.format;

/**
 * Initializes the logging system for a specific file
 */

export default class AppLogger {
    private _location: string;
    private _meta: string;
    private _fileLogger: winston.Logger | null;
    private _consoleLogger: winston.Logger | null;
    private _mongoLogger: winston.Logger | null;
    private _logLevel: string;

    constructor(callingModule: { filename: string }) {
        var parts = callingModule.filename.split('/');
        this._location = parts[parts.length - 2] + '/' + parts.pop();
        this._meta = '';
        this._fileLogger = null;
        this._consoleLogger = null;
        this._mongoLogger = null;
        this._logLevel = AppEnv.Get(Env.LOG_LEVEL);
        const consoleLogEnabled = parseBool(AppEnv.Get(Env.CONSOLELOG_ENABLED));
        const fileLogEnabled = parseBool(AppEnv.Get(Env.FILELOG_ENABLED));
        const mongoLogEnabled = parseBool(AppEnv.Get(Env.MONGOLOG_ENABLED));

        if (fileLogEnabled === true) {
            this.configFileLogger(callingModule.filename);
        }

        if (consoleLogEnabled === true) {
            this.configConsoleLogger(callingModule.filename);
        }

        if (mongoLogEnabled === true) {
            this.configMongoLogger(callingModule.filename);
        }
    }

    error(message: string, jSonMetaData: object | undefined = undefined): void {
        this._fileLogger?.error(message, this.getLogFileDefault(jSonMetaData));
        this._consoleLogger?.error(message, this.getLogFileDefault(jSonMetaData));
        this._mongoLogger?.error(message, this.getLogFileDefault(jSonMetaData));
    }

    warn(message: string, jSonMetaData: object | undefined = undefined): void {
        this._fileLogger?.warn(message, this.getLogFileDefault(jSonMetaData));
        this._consoleLogger?.warn(message, this.getLogFileDefault(jSonMetaData));
        this._mongoLogger?.warn(message, this.getLogFileDefault(jSonMetaData));
    }

    info(message: string, jSonMetaData: object | undefined = undefined): void {
        this._fileLogger?.info(message, this.getLogFileDefault(jSonMetaData));
        this._consoleLogger?.info(message, this.getLogFileDefault(jSonMetaData));
        this._mongoLogger?.info(message, this.getLogFileDefault(jSonMetaData));
    }

    debug(message: string, jSonMetaData: object | undefined = undefined): void {
        this._fileLogger?.debug(message, this.getLogFileDefault(jSonMetaData));
        this._consoleLogger?.debug(message, this.getLogFileDefault(jSonMetaData));
        this._mongoLogger?.debug(message, this.getLogFileDefault(jSonMetaData));
    }

    /**
     * Adds default metadat to a log entry
     * @param jSonMetaData {object} - optional default metadata to add to log
     * @returns {object} JSON object
     */
    getLogFileDefault(jSonMetaData: object | undefined): object {
        let logFileDefault = {
            location: this._location,
        };

        this._meta = '';

        if (jSonMetaData !== undefined && this.isJSON(jSonMetaData) === true) {
            logFileDefault = Object.assign({}, jSonMetaData, logFileDefault);
            this._meta = JSON.stringify(jSonMetaData);
        }

        return logFileDefault;
    }

    /**
     * @param callingModuleFileName {string} - full path to the calling module
     *  so that the name portion can be used to identify the console logger.
     */
    configConsoleLogger(callingModuleFileName: string): void {
        let consoleLoggerName = 'consoleLogger-';

        consoleLoggerName += callingModuleFileName.slice(
            callingModuleFileName.lastIndexOf(path.sep) + 1,
            callingModuleFileName.length - 3
        );

        winston.loggers.add(consoleLoggerName, {
            level: this._logLevel || 'info',
            format: combine(
                colorize({ all: true }),
                timestamp(),
                printf((info) => `[${info.timestamp}] ${info.level}: ${this._location}, ${info.message} ${this._meta}`)
            ),

            transports: [new winston.transports.Console()],
        });

        this._consoleLogger = winston.loggers.get(consoleLoggerName);
    }

    /**
     * @param callingModuleFileName {string} - full path to the calling module
     *  so that the name portion can be used to identify the file logger.
     */
    private configFileLogger(callingModuleFileName: string) {
        let fileLoggerName = 'fileLogger-';

        fileLoggerName += callingModuleFileName.slice(
            callingModuleFileName.lastIndexOf(path.sep) + 1,
            callingModuleFileName.length - 3
        );

        const fileRotateTransport = new DailyRotateFile({
            filename: 'AppLog-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxFiles: '4d',
        });

        winston.loggers.add(fileLoggerName, {
            level: this._logLevel || 'info',
            format: combine(timestamp(), json()),
            transports: [fileRotateTransport],
        });

        this._fileLogger = winston.loggers.get(fileLoggerName);
    }

    configMongoLogger(callingModuleFileName: string): void {
        let mongoLoggerName = 'mongoLogger-';

        const mongoTransport = new MongoDB({
            level: this._logLevel || 'info',
            db: AppEnv.Get(Env.MONGODB_URL),
            options: {
                useUnifiedTopology: true,
                useNewUrlParser: true,
            },
            collection: 'logs',
            format: combine(timestamp(), json()),
        } as MongoDBConnectionOptions);

        mongoLoggerName += callingModuleFileName.slice(
            callingModuleFileName.lastIndexOf(path.sep) + 1,
            callingModuleFileName.length - 3
        );

        winston.loggers.add(mongoLoggerName, {
            level: this._logLevel || 'info',
            format: combine(timestamp(), json()),
            transports: [mongoTransport],
        });

        this._mongoLogger = winston.loggers.get(mongoLoggerName);
    }

    /**
     * Returns a Boolean true if the passed data is a JSON object
     *
     * @param {object} data - data to check
     * @returns {boolean} - true if JSON object, false otherwise
     */

    isJSON(jSonObj: object): boolean {
        var ret = true;
        try {
            JSON.parse(JSON.stringify(jSonObj));
        } catch (e) {
            ret = false;
        }
        return ret;
    }
}
