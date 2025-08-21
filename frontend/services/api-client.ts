import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

export interface FetchResponse<T> {
    count: number;
    next: string | null;
    results: T[];
}

const axiosInstance =  axios.create({
    baseURL: 'https://api.assemblyai.com/v2',
    headers: {
        'Content-Type': 'multipart/form-data', // Default for FormData uploads
    },
    params: {
        key: '7af71124eb32438eac14bfac6d2c8fa7'
    }
})

export default class APIClient<T> {
    endpoint: string;

    constructor(endpoint: string) {
        this.endpoint = endpoint
    }

    getAll = (config: AxiosRequestConfig) => {
        return axiosInstance
            .get<FetchResponse<T>>(this.endpoint, config)
            .then(res=> res.data)
    }

    get = (id: string|number) => {
        return axiosInstance
        .get<T>(this.endpoint + '/' + id)
        .then(res=>res.data)
    }

    post = (data: any, config?: AxiosRequestConfig) => {
        return axiosInstance
        .post<T>(this.endpoint, data, config)
        .then((res: AxiosResponse<any>) => res.data)
        .catch((error: any) => this.handleError(error));
    };

    private handleError(error: any): never {
        const message = error.response?.data?.error || error.message || 'An unexpected error occurred';
        console.error(`API Error at ${this.endpoint}:`, message);
        throw new Error(message);
    }
}