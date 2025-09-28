// src/Pages/Tesoreria/AdminPageTesoreria.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import NavbarStaff from '../Dash/NavbarStaff';
import '../../Styles/staff/dashboard.css';
import '../../Styles/staff/background.css';
import { useAuth } from '../../AuthContext';
import ParticlesBackground from '../../Components/ParticlesBackground';
import { motion } from 'framer-motion';
import ButtonBack from '../../Components/ButtonBack';
import { FaChartLine, FaCashRegister, FaCalendarAlt } from 'react-icons/fa';

const tesoreriaLinks = [
  {
    to: '/dashboard/tesoreria/flujo',
    label: 'Flujo de Fondos',
    icon: <FaChartLine />,
    enabled: true
  },
  // Placeholders para el futuro (deshabilitados)
  {
    to: '#',
    label: 'Conciliaciones (Próx.)',
    icon: <FaCashRegister />,
    enabled: false
  },
  {
    to: '#',
    label: 'Calendario de Pagos (Próx.)',
    icon: <FaCalendarAlt />,
    enabled: false
  }
];

const AdminPageTesoreria = () => {
  const { userLevel } = useAuth(); // listo para permisos/roles futuros

  return (
    <>
      <NavbarStaff />
      <section className="relative w-full min-h-screen bg-white">
        {/* 🎨 Gradiente dorado/ámbar para Tesorería */}
        <div className="min-h-screen bg-gradient-to-b from-[#7c2d12] via-[#a16207] to-[#ca8a04]">
          <ParticlesBackground />
          <ButtonBack />
          <div className="text-center pt-24 px-4">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl titulo uppercase font-bold text-white mb-8 drop-shadow-md"
            >
              Tesorería
            </motion.h1>
            <p className="text-white/90 max-w-2xl mx-auto">
              Administra el flujo de fondos proyectado. Más herramientas de
              Tesorería se activarán aquí próximamente.
            </p>
          </div>

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 justify-center">
              {tesoreriaLinks.map(({ to, label, icon, enabled }, index) => {
                const CardInner = (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className={`${
                      enabled
                        ? 'bg-white/90 hover:shadow-amber-400'
                        : 'bg-white/70 opacity-80 cursor-not-allowed'
                    } backdrop-blur-xl shadow-lg transition-all duration-300 text-gray-800 font-semibold text-lg rounded-2xl w-full max-w-xs p-6 flex flex-col items-center justify-center border border-white/20 hover:scale-[1.03] gap-3`}
                  >
                    <span
                      className={`text-4xl ${
                        enabled ? 'text-amber-600' : 'text-amber-500/60'
                      }`}
                    >
                      {icon}
                    </span>
                    <span className="text-center">{label}</span>
                  </motion.div>
                );

                return enabled ? (
                  <Link
                    to={typeof to === 'string' ? to : to.pathname}
                    state={typeof to === 'object' ? to.state || {} : {}}
                    key={label}
                    className="flex justify-center"
                  >
                    {CardInner}
                  </Link>
                ) : (
                  <div key={label} className="flex justify-center select-none">
                    {CardInner}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default AdminPageTesoreria;
