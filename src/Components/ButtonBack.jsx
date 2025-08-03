import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

const ButtonBack = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className="fixed top-20 left-6 z-50 flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 px-4 rounded-full shadow-lg transition duration-300"
    >
      <FaArrowLeft className="text-white" />
      <span className="hidden sm:inline">Volver</span>
    </button>
  );
};

export default ButtonBack;
