const prisma = require('../config/prisma');

/**
 * Synchronize Logto user with local MongoDB user
 * @param {Object} logtoClaims 
 * @returns {Promise<Object>} The linked user
 */
const syncLogtoUser = async (logtoClaims) => {
  const { sub: logtoId, email, name } = logtoClaims;

  // 1. Try to find user by logtoId
  let user = await prisma.user.findUnique({
    where: { logtoId }
  });

  if (user) return user;

  // 2. Try to find user by email (existing legacy user)
  user = await prisma.user.findUnique({
    where: { email }
  });

  if (user) {
    // Link legacy user to Logto
    user = await prisma.user.update({
      where: { id: user.id },
      data: { 
        logtoId,
        isEmailVerified: true // Logto handles verification
      }
    });
    return user;
  }

  // 3. Create new user if not found (Optional: depending on if you want auto-registration)
  // For now, let's auto-create as well if they come via Logto
  user = await prisma.user.create({
    data: {
      logtoId,
      email,
      name: name || email.split('@')[0],
      password: 'LOGTO_AUTH_USER', // Placeholder since they use Logto
      isEmailVerified: true,
    }
  });

  return user;
};

module.exports = { syncLogtoUser };
