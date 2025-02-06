import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";

/**
 * Middleware de autenticação com JWT.
 * Verifica se o cabeçalho Authorization possui um token válido.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Token não fornecido." });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2) {
    return res.status(401).json({ error: "Token mal formatado." });
  }

  const [scheme, token] = parts;
  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ error: "Token mal formatado." });
  }

  jwt.verify(token, config.auth.secret!, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Token inválido." });
    }
    // Se necessário, você pode anexar as informações do token à requisição:
    // (ex: req.user = decoded)
    next();
  });
} 