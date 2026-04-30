import axios from 'axios';

const API_URL = 'https://your-backend-api-url.com/api'; // Replace with your actual backend API URL

export const loginAsStudent = async (credentials) => {
    try {
        const response = await axios.post(`${API_URL}/student/login`, credentials);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : error.message;
    }
};

export const loginAsJobSeeker = async (credentials) => {
    try {
        const response = await axios.post(`${API_URL}/jobseeker/login`, credentials);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : error.message;
    }
};

// Add more API functions as needed for other functionalities
