// src/Hooks/useLayoutVisibility.js
import { useLocation } from 'react-router-dom';

const useLayoutVisibility = () => {
  const location = useLocation();

  const path = location.pathname;

  const hideLayoutFooter = path === '/login';

  const hideLayoutNav = path === '/login' || path.startsWith('/dashboard');

  return { hideLayoutFooter, hideLayoutNav };
};

export default useLayoutVisibility;
