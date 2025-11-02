// Mock email service for development
const sendWelcomeEmail = async (email, name) => {
  console.log(`📧 [MOCK] Welcome email would be sent to: ${email} for user: ${name}`);
  return Promise.resolve();
};

module.exports = { sendWelcomeEmail };