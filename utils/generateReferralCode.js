export const generateReferralCode = (name) => {
  return (
    name.substring(0, 3).toUpperCase() +
    Math.random().toString(36).substring(2, 8).toUpperCase()
  );
};
