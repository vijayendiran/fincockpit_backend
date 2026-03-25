const { createRemoteJWKSet, jwtVerify } = require('jose');

const logtoEndpoint = process.env.LOGTO_ENDPOINT;
const jwksUrl = new URL('/oidc/jwks', logtoEndpoint).toString();
const JWKS = createRemoteJWKSet(new URL(jwksUrl));

/**
 * Verify a Logto Access Token (JWT)
 * @param {string} token 
 * @returns {Promise<any>}
 */
const verifyLogtoToken = async (token) => {
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: new URL('/oidc', logtoEndpoint).toString(),
      audience: process.env.LOGTO_API_RESOURCE,
    });
    return payload;
  } catch (error) {
    console.error('Logto Token Verification Failed:', error.message);
    return null;
  }
};

module.exports = { verifyLogtoToken };
