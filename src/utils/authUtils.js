export const getUserId = () => {
  return localStorage.getItem('userId') || null;
};
