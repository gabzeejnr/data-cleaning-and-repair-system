import axios from "axios";

const urlIndex:number = 0;
const baseUrl = [
    "http://localhost:4000",
    "https://data-cleaning-and-repair-system-express.onrender.com"
][urlIndex];
const mlBaseUrl = [
    "http://127.0.0.1:8000",
    "https://data-cleaning-and-repair-system-python.onrender.com"
][urlIndex];

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