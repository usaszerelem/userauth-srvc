import axios, { AxiosError } from 'axios';
import AppLogger from './Logger';
import { AppEnv, Env } from './AppEnv';
const logger = new AppLogger(module);

export async function sendRbacRoleIds(roleIds: string[]): Promise<string[]> {
    let serviceOpIds: string[] = [];

    try {
        const srvcName = 'userauth-srvc';
        const rbacApiKey = AppEnv.Get(Env.RBAC_API_KEY);

        // This shoudl be the full URL to call to retreive service operation
        // IDs that are associated with roles.
        const rbacUrl = AppEnv.Get(Env.RBAC_ROLES_URL);

        const body = {
            roleIds: roleIds,
        };

        let strPayload = JSON.stringify(body);
        logger.debug(strPayload);

        // Specifying headers in the AppConfig object
        const reqHeader = {
            'content-type': 'application/json',
            'content-length': strPayload.length,
            'User-Agent': srvcName,
            Connection: 'keep-alive',
            'x-api-key': rbacApiKey,
        };

        const response = await axios.post(rbacUrl!, strPayload, {
            headers: reqHeader,
        });

        logger.debug(response.data);
        serviceOpIds = response.data;
    } catch (err: any | AxiosError) {
        throw new Error('RBAC connection refused. Service is probably not running.');
    }

    return serviceOpIds;
}
