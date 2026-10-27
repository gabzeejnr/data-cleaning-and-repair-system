import axios from "axios";
const baseUrl = "https://data-cleaning-and-repair-system-express.onrender.com";
const mlBaseUrl = "https://data-cleaning-and-repair-system-python.onrender.com/";

const AUTH = axios.create({
    baseURL: `${baseUrl}/auth`,
    withCredentials: true
})

const API = axios.create({
    baseURL: `${baseUrl}/api`,
    withCredentials: true
})

const ML_API = axios.create({
    baseURL: `${mlBaseUrl}/api`,
    timeout: 60_000
})

export { API, AUTH, ML_API }