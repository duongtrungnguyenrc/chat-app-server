export default class BaseResponseModel {
    statusCode?: number;
    message: string;
    data?: any;

    constructor(message: string, data?: any, statusCode?: number) {
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
    }
}
