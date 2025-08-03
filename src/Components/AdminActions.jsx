// src/Components/AdminActions.jsx
import React from 'react';
import { useAuth } from '../AuthContext';
import { FaEdit, FaTrash } from 'react-icons/fa';

export default function AdminActions({ onEdit, onDelete }) {
  const { userLevel } = useAuth();

  if (userLevel !== 'admin') return null;

  return (
    <div className="mt-4 flex justify-end gap-4">
      {onEdit && (
        <button
          onClick={onEdit}
          className="text-yellow-400 hover:text-yellow-300"
        >
          <FaEdit />
        </button>
      )}
      {onDelete && (
        <button onClick={onDelete} className="text-red-500 hover:text-red-400">
          <FaTrash />
        </button>
      )}
    </div>
  );
}
