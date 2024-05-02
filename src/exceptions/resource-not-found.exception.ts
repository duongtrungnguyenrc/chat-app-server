export class ResourceNotFoundException extends Error {
    constructor(msg?: string) {
        super(msg ?? "Resource not found!");
        Object.setPrototypeOf(this, ResourceNotFoundException.prototype);
    }
}
