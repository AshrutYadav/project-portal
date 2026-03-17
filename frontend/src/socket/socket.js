import { io } from "socket.io-client";

const SOCKET_URL = process.env.NODE_ENV === "production" 
  ? process.env.REACT_APP_BACKEND_URL 
  : "http://localhost:5000";

export const socket = io(SOCKET_URL);