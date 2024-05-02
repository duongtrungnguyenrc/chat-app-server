export class InvalidQueryParamException extends Error {
    constructor(msg?: string) {
        super(msg ?? "Invalid query param!");
        Object.setPrototypeOf(this, InvalidQueryParamException.prototype);
    }
}
