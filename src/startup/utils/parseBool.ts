export default function parseBool(boolString: string | undefined): boolean {
    return boolString === undefined ? false : /true/i.test(boolString);
}
