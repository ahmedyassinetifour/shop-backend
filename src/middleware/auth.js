import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function authenticateGoogleToken(token) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return null;

  // An OIDC ID token is a signed JWT whose audience is this application.
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: token, audience: clientId });
    const payload = ticket.getPayload();
    if (payload?.sub && payload.email_verified) {
      return { type: 'google-id-token', user: { id: payload.sub, name: payload.name, email: payload.email } };
    }
  } catch {
    // OAuth access tokens are opaque and cannot be verified as JWTs. Try Google's
    // access-token information endpoint below instead.
  }

  // OAuth 2.0 access tokens are validated by Google. Check that the token was
  // issued to this client and grants the identity scope expected by the API.
  const tokenInfo = await googleClient.getTokenInfo(token);
  const scopes = new Set(tokenInfo.scopes || []);
  const hasEmailScope = scopes.has('email') || scopes.has('https://www.googleapis.com/auth/userinfo.email');
  const subject = tokenInfo.sub || tokenInfo.user_id;
  if (tokenInfo.aud !== clientId || tokenInfo.expiry_date <= Date.now() || !hasEmailScope || !subject || tokenInfo.email_verified !== true) {
    return null;
  }

  return { type: 'google-access-token', user: { id: subject, email: tokenInfo.email } };
}

export async function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return res.status(401).json({ error: 'Bearer token required.' });

  try {
    try {
      req.auth = { type: 'jwt', user: jwt.verify(token, process.env.JWT_SECRET) };
      return next();
    } catch (jwtError) {
      if (jwtError.name !== 'JsonWebTokenError' && jwtError.name !== 'TokenExpiredError') throw jwtError;
    }

    req.auth = await authenticateGoogleToken(token);
    if (!req.auth) return res.status(401).json({ error: 'Invalid or expired token.' });
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}
