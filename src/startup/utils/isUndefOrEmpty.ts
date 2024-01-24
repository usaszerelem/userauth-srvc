export default function isUndefOrEmpty(object: string | undefined): boolean {
    return object === undefined || object === '' ? true : false;
}
