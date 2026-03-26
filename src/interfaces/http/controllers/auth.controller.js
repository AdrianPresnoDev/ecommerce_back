// src/interfaces/http/controllers/auth.controller.js
import * as authService from '../../../contexts/users/application/services/auth.service.js';

export async function signup(req, res) {
  try {
    const { email, name, password } = req.body;
    if (!email || !name || !password) {
      return res.status(400).json({ error: 'email, name y password son obligatorios' });
    }
    const result = await authService.signup({ email, name, password });
    return res.status(201).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email y password son obligatorios' });
    }
    const result = await authService.login({ email, password });
    return res.json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

export async function me(req, res) {
  try {
    const user = await authService.getProfile(req.auth.userId);
    return res.json(user);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}
