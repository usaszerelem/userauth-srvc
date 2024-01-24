import { createSuperUser } from '../startup/utils/createSuperUser';

createSuperUserWrapper();

async function createSuperUserWrapper(): Promise<void> {
    return await createSuperUser();
}
