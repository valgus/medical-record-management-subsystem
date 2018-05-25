const crypto    = require('crypto');
const algorithm = 'aes-256-ctr';
const salt      = 'medicalrecordssubsystem1';

/**
 * EncryptionService
 */

module.exports = {

  encrypt(string, password) {
    const cipher = crypto.createCipher(algorithm, password + salt);
    let encrypted = cipher.update(string, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return encrypted;
  },

  decrypt(string, password) {
    const decipher = crypto.createDecipher(algorithm, password + salt);
    let decrypted = decipher.update(string, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  },

}
