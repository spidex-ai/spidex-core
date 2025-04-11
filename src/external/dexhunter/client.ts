import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

@Injectable()
export class DexHunterClient {
    private client: AxiosInstance;
    constructor() {
        console.log('DEXHUNTER_API_URL:::', process.env.DEXHUNTER_API_URL)
        this.client = axios.create({
            baseURL: process.env.DEXHUNTER_API_URL,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Make a GET request to the Taptools API
     * @param endpoint - API endpoint
     * @param params - Query parameters
     * @returns Promise with the response data
     */
    async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
        try {
            const config: AxiosRequestConfig = {
                params,
            };

            console.log(`Making GET request to: ${endpoint}`);
            const response = await this.client.get<T>(endpoint, config);
            return response.data;
        } catch (error: any) {
            this.handleError(error);
            throw error;
        }
    }

    /**
     * Make a POST request to the Taptools API
     * @param endpoint - API endpoint
     * @param data - Request body
     * @returns Promise with the response data
     */
    async post<T>(endpoint: string, data?: any): Promise<T> {
        try {
            console.log(`Making POST request to: ${endpoint}`);
            const response = await this.client.post<T>(endpoint, data);
            return response.data;
        } catch (error: any) {
            this.handleError(error);
            throw error;
        }
    }

    /**
     * Handle API errors
     * @param error - Error object
     */
    private handleError(error: any): void {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('Dexhunter API error:', {
                status: error.response.status,
                data: error.response.data,
                url: error.config?.url,
            });
        } else if (error.request) {
            // The request was made but no response was received
            console.error('Dexhunter API request error:', error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Dexhunter API error:', error.message);
        }
    }
}