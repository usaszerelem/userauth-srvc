export enum Env {
    SERVICE_NAME = 'SERVICE_NAME',
    USE_HTTPS = 'USE_HTTPS',
    PORT = 'PORT',
    AUDIT_ENABLED = 'AUDIT_ENABLED',
    AUDIT_URL = 'AUDIT_URL',
    AUDIT_API_KEY = 'AUDIT_API_KEY',
    JWT_PRIVATE_KEY = 'JWT_PRIVATE_KEY',
    JWT_EXPIRATION = 'JWT_EXPIRATION',
    MONGODB_URL = 'MONGODB_URL',
    LOG_LEVEL = 'LOG_LEVEL',
    CONSOLELOG_ENABLED = 'CONSOLELOG_ENABLED',
    FILELOG_ENABLED = 'FILELOG_ENABLED',
    MONGOLOG_ENABLED = 'MONGOLOG_ENABLED',
    SERVICE_EMAIL_ADDRESS = 'SERVICE_EMAIL_ADDRESS',
    SERVICE_EMAIL_PASSWORD = 'SERVICE_EMAIL_PASSWORD',
    OTP_EXPIRATION_MINUTES = 'OTP_EXPIRATION_MINUTES',
}

export class AppEnv {
    private static instance: AppEnv;
    private static allSettings: [Env, string][] = [];
    private missingEnvVars: string[] = [];

    private constructor() {
        this.GetEnvVar(process.env.SERVICE_NAME, Env.SERVICE_NAME);
        this.GetEnvVar(process.env.USE_HTTPS, Env.USE_HTTPS);
        this.GetEnvVar(process.env.PORT, Env.PORT);
        this.GetEnvVar(process.env.AUDIT_ENABLED, Env.AUDIT_ENABLED);
        this.GetEnvVar(process.env.AUDIT_URL, Env.AUDIT_URL);
        this.GetEnvVar(process.env.AUDIT_API_KEY, Env.AUDIT_API_KEY);
        this.GetEnvVar(process.env.JWT_PRIVATE_KEY, Env.JWT_PRIVATE_KEY);
        this.GetEnvVar(process.env.JWT_EXPIRATION, Env.JWT_EXPIRATION);
        this.GetEnvVar(process.env.MONGODB_URL, Env.MONGODB_URL);
        this.GetEnvVar(process.env.LOG_LEVEL, Env.LOG_LEVEL);
        this.GetEnvVar(process.env.CONSOLELOG_ENABLED, Env.CONSOLELOG_ENABLED);
        this.GetEnvVar(process.env.FILELOG_ENABLED, Env.FILELOG_ENABLED);
        this.GetEnvVar(process.env.MONGOLOG_ENABLED, Env.MONGOLOG_ENABLED);
        this.GetEnvVar(process.env.SERVICE_EMAIL_ADDRESS, Env.SERVICE_EMAIL_ADDRESS);
        this.GetEnvVar(process.env.SERVICE_EMAIL_PASSWORD, Env.SERVICE_EMAIL_PASSWORD);
        this.GetEnvVar(process.env.OTP_EXPIRATION_MINUTES, Env.OTP_EXPIRATION_MINUTES);

        if (this.missingEnvVars.length > 0) {
            const msg = '*** ERROR: Missing environment variables: ' + this.missingEnvVars.flat();
            console.log(msg);
            throw new Error(msg);
        }
    }

    private GetEnvVar(envVar: string | undefined, setting: Env): void {
        if (envVar !== undefined) {
            AppEnv.allSettings.push([setting, envVar]);
        } else {
            this.missingEnvVars.push(setting);
        }
    }

    public static Get(setting: Env): string {
        if (!AppEnv.instance) {
            AppEnv.instance = new AppEnv();
        }

        const t = AppEnv.allSettings.find((e) => e[0] === setting);

        if (t !== undefined) {
            return t[1];
        }

        throw new Error(`Could not find AppConfig: ${setting}`);
    }
}
