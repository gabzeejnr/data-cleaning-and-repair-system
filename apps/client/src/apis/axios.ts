import axios from "axios";
const baseUrl = "http://localhost:4000";
const mlBaseUrl = "http://127.0.0.1:8000";

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