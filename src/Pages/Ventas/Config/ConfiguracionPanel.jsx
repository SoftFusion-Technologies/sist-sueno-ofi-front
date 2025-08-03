import { FaCreditCard, FaCog, FaTicketAlt } from 'react-icons/fa';
import ParticlesBackground from '../../../Components/ParticlesBackground';
import ButtonBack from '../../../Components/ButtonBack';
import { useEffect, useState } from 'react';
import TicketConfigCard from './TicketConfigCard';

export default function ConfiguracionPanel({
  abrirModalMediosPago,
  loadingMediosPago
}) {
  const [openTicketConfig, setOpenTicketConfig] = useState(false);

  // Detectar tamaño de pantalla para bloquear en mobile:
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-6 py-8 min-h-screen flex flex-col">
      <ParticlesBackground />
      <ButtonBack />
      {/* Header */}
      <div className="mb-10 flex items-center justify-center gap-4 text-center">
        <span className="-mt-10 inline-flex items-center justify-center bg-emerald-100 dark:bg-emerald-900 rounded-full p-3 shadow-lg">
          <FaCog className="text-emerald-600 dark:text-emerald-400 text-4xl animate-spin-slow" />
        </span>
        <div>
          <h1 className="titulo uppercase text-3xl sm:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-cyan-500 to-violet-500 animate-gradient-move inline-block drop-shadow-xl select-none">
            Configuración
          </h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400 text-base sm:text-lg font-medium">
            Personalizá tu sistema y mantené todo bajo control
          </p>
        </div>
      </div>

      {/* Cards */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* Card: Medios de Pago */}
        <div className="relative group bg-white/80 dark:bg-zinc-900/90 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl p-8 flex flex-col items-center text-center backdrop-blur-sm transition-transform hover:scale-[1.025] hover:shadow-2xl">
          <div className="absolute -top-6 -right-8 w-32 h-32 bg-gradient-to-br from-emerald-300/20 to-transparent rounded-full blur-2xl opacity-60 group-hover:opacity-80 pointer-events-none transition" />
          <div className="absolute -bottom-8 -left-6 w-24 h-24 bg-gradient-to-tl from-cyan-200/20 to-transparent rounded-full blur-2xl opacity-50 pointer-events-none transition" />

          <FaCreditCard className="text-emerald-500 text-5xl mb-6 drop-shadow-xl" />
          <h2 className="text-2xl font-bold mb-3 text-zinc-800 dark:text-zinc-50 tracking-tight">
            Medios de Pago
          </h2>
          <p className="text-zinc-500 dark:text-zinc-300 mb-8 text-base leading-relaxed font-medium">
            Gestioná todos los medios de pago habilitados para ventas: agregá,
            editá y administrá con un solo click.
          </p>
          <button
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-extrabold text-xl shadow-lg hover:from-emerald-600 hover:to-cyan-600 active:scale-95 transition-all flex items-center justify-center gap-3 drop-shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
            onClick={abrirModalMediosPago}
            disabled={loadingMediosPago}
          >
            <FaCreditCard className="text-2xl" />
            Gestionar Medios de Pago
          </button>
        </div>

        {/* Card: Ticket de Venta */}
        <div className="relative group bg-white/80 dark:bg-zinc-900/90 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl p-8 flex flex-col items-center text-center backdrop-blur-sm transition-transform hover:scale-[1.025] hover:shadow-2xl">
          <div className="absolute -top-10 -right-16 w-40 h-40 bg-gradient-to-br from-violet-400/10 to-transparent rounded-full blur-2xl opacity-40 pointer-events-none" />
          <div className="absolute -bottom-8 -left-6 w-24 h-24 bg-gradient-to-tl from-cyan-200/20 to-transparent rounded-full blur-2xl opacity-50 pointer-events-none transition" />
          <FaTicketAlt className="text-violet-500 text-5xl mb-6 drop-shadow-xl" />
          <h2 className="text-2xl font-bold mb-3 text-zinc-800 dark:text-zinc-50 tracking-tight">
            Ticket de Venta
          </h2>
          <p className="text-zinc-500 dark:text-zinc-300 mb-8 text-base leading-relaxed font-medium">
            Personalizá el título, dirección, mensaje y todos los datos que
            aparecen en tu comprobante de venta.
          </p>
          <button
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-cyan-500 text-white font-extrabold text-xl shadow-lg hover:from-violet-600 hover:to-cyan-600 active:scale-95 transition-all flex items-center justify-center gap-3 drop-shadow-lg focus:outline-none focus:ring-2 focus:ring-violet-400"
            onClick={() => {
              if (isDesktop) setOpenTicketConfig(true);
              else
                setOpenTicketConfig(true)
            }}
          >
            <FaTicketAlt className="text-2xl" />
            Configurar Ticket
          </button>
        </div>
        {/* Card: Placeholder Futuras Configuraciones */}
        <div className="relative bg-white/60 dark:bg-zinc-800/80 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-700 flex flex-col items-center justify-center text-center min-h-[320px] group overflow-hidden shadow-lg hover:scale-[1.01] hover:shadow-xl transition">
          <div className="absolute -top-10 -right-16 w-40 h-40 bg-gradient-to-br from-violet-400/10 to-transparent rounded-full blur-2xl opacity-40 pointer-events-none" />
          <span className="text-zinc-400 text-3xl mb-2 select-none animate-pulse">
            ⚡️
          </span>
          <h2 className="text-xl font-bold text-zinc-400 mb-2 tracking-tight">
            Próximamente
          </h2>
          <p className="text-zinc-400 text-base">
            Más configuraciones en camino…
          </p>
        </div>
      </div>

      {/* Modal de Configuración de Ticket SOLO EN DESKTOP */}
      {openTicketConfig && isDesktop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-3xl mx-2">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-6 overflow-x-hidden max-w-full">
              <button
                className="absolute top-2 right-2 text-zinc-400 hover:text-zinc-800 dark:hover:text-white text-2xl"
                onClick={() => setOpenTicketConfig(false)}
                title="Cerrar"
              >
                ×
              </button>
              <TicketConfigCard />
            </div>
          </div>
        </div>
      )}

      {/* Mensaje sólo para mobile/tablet si intentan acceder a la config */}
      {openTicketConfig && !isDesktop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-yellow-100 dark:bg-yellow-900/80 text-yellow-900 dark:text-yellow-100 font-semibold p-8 rounded-2xl shadow-xl max-w-xs w-full text-center text-lg tracking-tight relative">
            <button
              className="absolute top-2 right-3 text-2xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              onClick={() => setOpenTicketConfig(false)}
              title="Cerrar"
            >
              ×
            </button>
            <span className="inline-block text-2xl mb-2">⚠️</span>
            <br />
            La configuración del ticket
            <br />
            <span className="text-zinc-900 dark:text-white font-bold">
              sólo está disponible desde una PC o pantalla grande.
            </span>
            <br />
            Por seguridad y mejor experiencia, usá una computadora de escritorio
            o notebook.
          </div>
        </div>
      )}
    </div>
  );
}
