export class InvalidPasswordException extends Error {
    constructor(msg?: string) {
        super(msg ?? "Invalid password!");
        Object.setPrototypeOf(this, InvalidPasswordException.prototype);
    }
}
