// src/Components/Compras/StockMovimientos/StockMovimientoNotasModal.jsx
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, StickyNote } from 'lucide-react';
import { Alerts, getErrorMessage } from '../../../utils/alerts';
import {
  backdropV,
  panelV,
  formContainerV,
  fieldV
} from '../../../ui/animHelpers';

export default function StockMovimientoNotasModal({
  open,
  onClose,
  onSubmit,
  row
}) {
  const [notas, setNotas] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNotas(row?.notas || '');
  }, [open, row]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      Alerts.loading('Actualizando notas...');
      await onSubmit(notas);
      Alerts.close();
      Alerts.toastSuccess('Notas actualizadas');
      onClose();
    } catch (err) {
      Alerts.close();
      await Alerts.error(
        'No se pudo guardar',
        getErrorMessage(err, 'Error actualizando notas')
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
          variants={backdropV}
          initial="hidden"
          animate="visible"
          exit="exit"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            variants={panelV}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-[94vw] sm:max-w-lg
                       rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl"
          >
            <button
              onClick={onClose}
              className="absolute z-50 top-2.5 right-2.5 inline-flex h-9 w-9 items-center justify-center rounded-lg
                         bg-white/5 border border-white/10 hover:bg-white/10 transition"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5 text-gray-200" />
            </button>

            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <StickyNote className="h-6 w-6 text-gray-300" />
                <h3 className="text-xl font-bold text-white">Editar notas</h3>
              </div>

              <motion.form
                onSubmit={submit}
                variants={formContainerV}
                initial="hidden"
                animate="visible"
                className="space-y-4"
              >
                <motion.div variants={fieldV}>
                  <textarea
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    rows={5}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                               placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                    placeholder="Notas (máx. 300)…"
                  />
                  <div className="mt-2 text-xs text-gray-400">
                    {Math.min((notas || '').length, 300)}/300
                  </div>
                </motion.div>

                <motion.div
                  variants={fieldV}
                  className="flex justify-end gap-2"
                >
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl border border-white/10 text-gray-200 hover:bg-white/10 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-semibold
                               hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition"
                  >
                    {saving ? 'Guardando…' : 'Guardar'}
                  </button>
                </motion.div>
              </motion.form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
