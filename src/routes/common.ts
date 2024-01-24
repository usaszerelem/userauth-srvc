import { IEntityReturn } from '../dtos/IEntityReturn';
import isUndefOrEmpty from '../startup/utils/isUndefOrEmpty';

export const maxPageSize = 100;

/**
 * This method constructs an object for the database to filter documents
 * @param filterByField - optional query parameter to field name to filter by
 * @param filterValue - value to filter by
 * @param isString - whether to use RegEx to search string field
 * @param isActive - By default only active products are returned
 * @returns JSON object for DB to filter on.
 */
export function getFilter(
    filterByField: string | undefined,
    filterValue: string | undefined,
    isString: boolean,
    isActive: boolean | undefined
) {
    var obj: any = {};

    if (isActive !== undefined) {
        obj['isActive'] = isActive;
    }

    if (isUndefOrEmpty(filterByField) == false && isUndefOrEmpty(filterValue) == false) {
        const value = filterValue!.toString().trim().toLowerCase();

        if (value === 'true' || value === 'false') {
            obj[filterByField!] = value === 'true' ? true : false;
        } else if (isString === true) {
            var reg: any = {};
            reg['$options'] = 'i';
            reg['$regex'] = filterValue;
            obj[filterByField!] = reg;
        } else {
            obj[filterByField!] = parseInt(filterValue!);
        }
    }

    return obj;
}

/**
 *
 * @param fieldRequested Return a JSON object that specified to the database
 * the list of fields that the user is requesting.
 * @returns JSON object listing requested fields.
 */
export function selectFields(fieldRequested: string[]) {
    var obj: any = {};

    if (fieldRequested !== undefined) {
        fieldRequested.forEach((field) => {
            obj[field] = 1;
        });
    }

    return obj;
}

/**
 *
 * @param sortBy - optional field that information is requested to be sorted by
 * @returns JSON object for DB query to sort by requested field
 */
export function getSortField(sortBy: string | undefined) {
    var obj: any = {};

    if (sortBy !== undefined) {
        obj[sortBy] = 1;
    }

    return obj;
}

/**
 * This function builds the return object that is returned from the GET call where
 * several products are returned. Paging help is provided.
 * @param req - HTTP Request object
 * @param pageNumber - Current page number that was requested
 * @param pageSize - Page size that was requested
 * @param products - Array of products that are returned
 * @returns {ProductsReturn} - JSON object of type ProductsReturn
 */
export function buildResponse<T>(fullUrl: string, pageNumber: number, pageSize: number, products: T[]): IEntityReturn<T> {
    const idx = fullUrl.lastIndexOf('?');

    if (idx !== -1) {
        fullUrl = fullUrl.substring(0, idx);
    }

    let response: IEntityReturn<T> = {
        pageSize: pageSize,
        pageNumber: pageNumber,
        _links: {
            base: fullUrl,
        },
        results: products,
    };

    if (pageNumber > 1) {
        response._links.prev = fullUrl + `?pageSize=${pageSize}&pageNumber=${pageNumber - 1}`;
    }

    if (products.length === pageSize) {
        response._links.next = fullUrl + `?pageSize=${pageSize}&pageNumber=${pageNumber + 1}`;
    }

    return response;
}
