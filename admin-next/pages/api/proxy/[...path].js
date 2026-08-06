// pages/api/proxy/[...path].js - Proxy API
import { apiFetch } from '../../../lib/api';

export default async function handler(req, res) {
  try {
    let token = req.headers.authorization?.replace('Bearer ', '');
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }
    const { path } = req.query;
    const pathString = Array.isArray(path) ? path.join('/') : path;
    const url = `/api/${pathString}`;
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await apiFetch(url, {
      method: req.method,
      headers,
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy error', message: error.message });
  }
}

export const config = {
  api: {
    bodyParser: true,
  },
};
