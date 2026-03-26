// src/contexts/users/application/services/auth.service.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sequelize } from '../../../../interfaces/db/mysql-client.js';

function generateToken(userId) {
  return jwt.sign(
    { sub: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || '7d' }
  );
}

export async function signup({ email, name, password }) {
  const { User } = sequelize.models;
  const existing = await User.findOne({ where: { email } });
  if (existing) throw Object.assign(new Error('Email ya registrado'), { status: 409 });

  const rounds = Number(process.env.BCRYPT_ROUNDS || 10);
  const passwordHash = await bcrypt.hash(password, rounds);
  const user = await User.create({ email, name, passwordHash });

  return { token: generateToken(user.id), user: { id: user.id, email: user.email, name: user.name } };
}

export async function login({ email, password }) {
  const { User } = sequelize.models;
  const user = await User.findOne({ where: { email } });
  if (!user) throw Object.assign(new Error('Credenciales incorrectas'), { status: 401 });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw Object.assign(new Error('Credenciales incorrectas'), { status: 401 });

  return { token: generateToken(user.id), user: { id: user.id, email: user.email, name: user.name } };
}

export async function getProfile(userId) {
  const { User } = sequelize.models;
  const user = await User.findByPk(userId, {
    attributes: ['id', 'email', 'name', 'createdAt'],
  });
  if (!user) throw Object.assign(new Error('Usuario no encontrado'), { status: 404 });
  return user;
}
