/**
 * return object type from a GET call that uses paging.
 */
export interface IEntityReturn<T> {
    _links: {
        base: string;
        next?: string;
        prev?: string;
    };
    pageSize: number;
    pageNumber: number;
    results: T[];
}
