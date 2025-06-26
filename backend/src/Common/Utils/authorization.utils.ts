import {HttpMethod} from "src/Common/consts/HttpMethod";

export const getDesiredFieldFromRequest = (request, desiredField: string): string | undefined => {
    switch (request.method) {
        case HttpMethod.GET:
            return request.query[desiredField];

        case HttpMethod.POST:
            return request.body[desiredField];

        case HttpMethod.PUT:
            return request.params[desiredField] || request.body[desiredField]

        case HttpMethod.DELETE:
            return request.params[desiredField];

        default:
            return undefined
    }
}
