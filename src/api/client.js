import axios from "axios";

const client = axios.create({
  baseURL: "https://test-fin.duckdns.org",
});

export function withAuth(accessToken) {
  return { headers: { Authorization: `Bearer ${accessToken}` } };
}

export default client;
