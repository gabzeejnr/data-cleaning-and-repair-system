import axios from "axios";
const baseUrl = "http://localhost:4000"

const AUTH = axios.create({
    baseURL: `${baseUrl}/auth`,
    withCredentials: true
})

const API = axios.create({
    baseURL: `${baseUrl}/api`,
    withCredentials: true
})

export { API, AUTH }