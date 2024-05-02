export class EmailAlreadyExistsException extends Error {
    constructor(msg?: string) {
        super(msg ?? "Email already exists in our system. please use another email!");
        Object.setPrototypeOf(this, EmailAlreadyExistsException.prototype);
    }
}
