import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaPlus,
  FaSearch,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaEllipsisV,
  FaTrash,
  FaEdit,
  FaBoxOpen,
  FaMapMarkerAlt,
} from "react-icons/fa";

// ================== CONFIG ==================
const API_BASE = "http://localhost:8080";

// Si usás auth global, reemplazá estos por useAuth()
const useFakeAuth = () => ({ userId: 1, userLocalId: 1 });
const ESTADOS = [
  "pendiente",
  "visto",
  "preparacion",
  "enviado",
  "entregado",
  "cancelado",
];
const ESTADO_BADGE = {
  pendiente: "bg-red-100 text-red-700",
  visto: "bg-yellow-100 text-yellow-700",
  preparacion: "bg-blue-100 text-blue-700",
  enviado: "bg-orange-100 text-orange-700",
  entregado: "bg-emerald-100 text-emerald-700",
  cancelado: "bg-gray-100 text-gray-700",
};
const ESTADO_EMOJI = {
  pendiente: "🟥",
  visto: "🟨",
  preparacion: "🟦",
  enviado: "🟧",
  entregado: "🟩",
  cancelado: "⬜",
};

// ================== HELPERS ==================
const fmtARS = (n) =>
  typeof n === "number"
    ? n.toLocaleString("es-AR", { style: "currency", currency: "ARS" })
    : "";

async function fetchJSON(url, opts = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.mensajeError || data.message || "Error");
  return data;
}

// ================== MODALS ==================
const Modal = ({ open, onClose, title, children, size = "max-w-3xl" }) => (
  <AnimatePresence>
    {open && (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
      >
        <motion.div
          className={`bg-white rounded-2xl shadow-2xl w-full ${size} max-h-[88vh] flex flex-col`}
          initial={{ scale: 0.95, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 20, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100"
              aria-label="Cerrar"
            >
              <FaTimes />
            </button>
          </div>
          <div className="p-6 overflow-y-auto">{children}</div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ================== PANEL PRINCIPAL ==================
export default function PedidosStockPanel() {
  const { userId, userLocalId } = useFakeAuth(); // reemplazar por useAuth()
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // filtros
  const [estado, setEstado] = useState("");
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [q, setQ] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  // paginación simple client-side (el back ya tiene limit/offset si querés)
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  // modales
  const [openCreate, setOpenCreate] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [openQty, setOpenQty] = useState(false);

  const [detailItem, setDetailItem] = useState(null);
  const [qtyItem, setQtyItem] = useState(null);

  // crear form
  const [form, setForm] = useState({
    producto_id: "",
    stock_id_origen: "",
    local_origen_id: "",
    local_destino_id: userLocalId || "",
    cantidad: 1,
    prioridad: "normal",
    observaciones: "",
  });

  // cantidades form
  const [qtyForm, setQtyForm] = useState({
    cantidad_preparada: "",
    cantidad_enviada: "",
    cantidad_recibida: "",
  });

  // Load inicial
  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (estado) params.set("estado", estado);
      if (origen) params.set("local_origen_id", origen);
      if (destino) params.set("local_destino_id", destino);
      if (q) params.set("q", q);
      if (desde) params.set("desde", desde);
      if (hasta) params.set("hasta", hasta);
      params.set("limit", 200); // traer suficiente para paginar en client

      const data = await fetchJSON(`${API_BASE}/pedidos?${params.toString()}`);
      setItems(Array.isArray(data) ? data : []);
      setPage(1);
    } catch (e) {
      console.error(e);
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredPage = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, page]);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));

  // acciones
  const openCreateModal = () => {
    setForm((f) => ({ ...f, local_destino_id: userLocalId || "" }));
    setOpenCreate(true);
  };

  const submitCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        cantidad: Number(form.cantidad || 0),
        usuario_log_id: userId,
      };
      await fetchJSON(`${API_BASE}/pedidos`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setOpenCreate(false);
      await loadData();
      alert("✅ Pedido creado");
    } catch (e) {
      console.error(e);
      alert(e.message);
    }
  };

  const askCancel = async (row) => {
    if (!window.confirm(`¿Cancelar el pedido #${row.id}?`)) return;
    try {
      await fetchJSON(`${API_BASE}/pedidos/${row.id}`, {
        method: "DELETE",
        body: JSON.stringify({ usuario_log_id: userId, motivo: "Desde panel" }),
      });
      await loadData();
      alert("Pedido cancelado");
    } catch (e) {
      alert(e.message);
    }
  };

  const changeEstado = async (row, nuevo_estado) => {
    try {
      await fetchJSON(`${API_BASE}/pedidos/${row.id}/estado`, {
        method: "PATCH",
        body: JSON.stringify({ nuevo_estado, usuario_log_id: userId }),
      });
      await loadData();
    } catch (e) {
      alert(e.message);
    }
  };

  const openQtyModal = (row) => {
    setQtyItem(row);
    setQtyForm({
      cantidad_preparada:
        row.cantidad_preparada ?? row.cantidad_solicitada ?? 0,
      cantidad_enviada: row.cantidad_enviada ?? 0,
      cantidad_recibida: row.cantidad_recibida ?? 0,
    });
    setOpenQty(true);
  };

  const submitQty = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...qtyForm,
        usuario_log_id: userId,
      };
      await fetchJSON(`${API_BASE}/pedidos/${qtyItem.id}/cantidades`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setOpenQty(false);
      await loadData();
    } catch (e) {
      alert(e.message);
    }
  };

  // UI helpers
  const EstadoBadge = ({ value }) => (
    <span
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold ${ESTADO_BADGE[value]}`}
      title={value}
    >
      <span>{ESTADO_EMOJI[value]}</span>
      {value}
    </span>
  );

  // ================== RENDER ==================
  return (
    <div className="w-full">
      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold">Pedidos entre sucursales</h1>
          <p className="text-gray-500 text-sm">
            Gestioná las transferencias de productos entre locales.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl shadow"
        >
          <FaPlus /> Nuevo pedido
        </button>
      </div>

      {/* FILTROS */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 p-4 bg-white rounded-xl shadow mb-4">
        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          className="border rounded-lg px-3 py-2"
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Local origen"
          value={origen}
          onChange={(e) => setOrigen(e.target.value)}
          className="border rounded-lg px-3 py-2"
        />
        <input
          type="number"
          placeholder="Local destino"
          value={destino}
          onChange={(e) => setDestino(e.target.value)}
          className="border rounded-lg px-3 py-2"
        />
        <input
          type="date"
          value={desde}
          onChange={(e) => setDesde(e.target.value)}
          className="border rounded-lg px-3 py-2"
        />
        <input
          type="date"
          value={hasta}
          onChange={(e) => setHasta(e.target.value)}
          className="border rounded-lg px-3 py-2"
        />
        <div className="flex">
          <input
            type="text"
            placeholder="Buscar observaciones..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="border rounded-l-lg px-3 py-2 w-full"
          />
          <button
            onClick={loadData}
            className="px-3 rounded-r-lg border border-l-0 bg-gray-50 hover:bg-gray-100"
            title="Buscar"
          >
            <FaSearch />
          </button>
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3">#</th>
                <th className="text-left px-4 py-3">Producto</th>
                <th className="text-left px-4 py-3">Origen → Destino</th>
                <th className="text-left px-4 py-3">Cantidades</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="text-left px-4 py-3">Creado</th>
                <th className="text-right px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center">
                    Cargando...
                  </td>
                </tr>
              )}
              {!loading && filteredPage.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                    Sin resultados
                  </td>
                </tr>
              )}
              {!loading &&
                filteredPage.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="px-4 py-3 font-semibold">#{row.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {row.producto?.nombre || `Prod ${row.producto_id}`}
                      </div>
                      <div className="text-xs text-gray-500">
                        SKU: {row.producto?.codigo_sku ?? "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FaMapMarkerAlt className="text-gray-400" />
                        <span className="text-gray-700">
                          {row.local_origen?.codigo || row.local_origen?.nombre || row.local_origen_id}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className="text-gray-700">
                          {row.local_destino?.codigo || row.local_destino?.nombre || row.local_destino_id}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-800">
                          Solicitada: <b>{row.cantidad_solicitada}</b>
                        </span>
                        <span className="text-gray-600">
                          Prep: <b>{row.cantidad_preparada}</b> · Env: <b>{row.cantidad_enviada}</b> · Rec: <b>{row.cantidad_recibida}</b>
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <EstadoBadge value={row.estado} />
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(row.created_at).toLocaleString("es-AR")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setDetailItem(row);
                            setOpenDetail(true);
                          }}
                          className="px-3 py-1.5 rounded-lg border hover:bg-gray-50 text-gray-700"
                          title="Ver"
                        >
                          <FaBoxOpen />
                        </button>

                        <EstadoMenu row={row} onChangeEstado={changeEstado} />

                        <button
                          onClick={() => openQtyModal(row)}
                          className="px-3 py-1.5 rounded-lg border hover:bg-gray-50 text-gray-700"
                          title="Editar cantidades"
                        >
                          <FaEdit />
                        </button>

                        <button
                          onClick={() => askCancel(row)}
                          className="px-3 py-1.5 rounded-lg border hover:bg-red-50 text-red-600"
                          title="Cancelar"
                          disabled={["entregado", "cancelado"].includes(row.estado)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* PAGINACIÓN */}
        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
          <div className="text-xs text-gray-500">
            {items.length} resultado(s) • Página {page}/{totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border bg-white disabled:opacity-50"
              title="Anterior"
            >
              <FaChevronLeft />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border bg-white disabled:opacity-50"
              title="Siguiente"
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: Crear */}
      <Modal open={openCreate} onClose={() => setOpenCreate(false)} title="Nuevo pedido">
        <form onSubmit={submitCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="number"
            required
            placeholder="Producto ID"
            className="border rounded-lg px-3 py-2"
            value={form.producto_id}
            onChange={(e) => setForm((f) => ({ ...f, producto_id: e.target.value }))}
          />
          <input
            type="number"
            placeholder="Stock origen (opcional)"
            className="border rounded-lg px-3 py-2"
            value={form.stock_id_origen}
            onChange={(e) => setForm((f) => ({ ...f, stock_id_origen: e.target.value }))}
          />
          <input
            type="number"
            required
            placeholder="Local origen ID"
            className="border rounded-lg px-3 py-2"
            value={form.local_origen_id}
            onChange={(e) => setForm((f) => ({ ...f, local_origen_id: e.target.value }))}
          />
          <input
            type="number"
            required
            placeholder="Local destino ID"
            className="border rounded-lg px-3 py-2"
            value={form.local_destino_id}
            onChange={(e) => setForm((f) => ({ ...f, local_destino_id: e.target.value }))}
          />
          <input
            type="number"
            min={1}
            required
            placeholder="Cantidad"
            className="border rounded-lg px-3 py-2"
            value={form.cantidad}
            onChange={(e) => setForm((f) => ({ ...f, cantidad: e.target.value }))}
          />
          <select
            className="border rounded-lg px-3 py-2"
            value={form.prioridad}
            onChange={(e) => setForm((f) => ({ ...f, prioridad: e.target.value }))}
          >
            <option value="normal">prioridad: Normal</option>
            <option value="alta">prioridad: Alta</option>
          </select>
          <textarea
            placeholder="Observaciones"
            className="border rounded-lg px-3 py-2 md:col-span-2"
            rows={3}
            value={form.observaciones}
            onChange={(e) => setForm((f) => ({ ...f, observaciones: e.target.value }))}
          />
          <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setOpenCreate(false)}
              className="px-4 py-2 rounded-lg border hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Crear pedido
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Detalle */}
      <Modal
        open={openDetail}
        onClose={() => setOpenDetail(false)}
        title={`Pedido #${detailItem?.id ?? ""}`}
        size="max-w-xl"
      >
        {detailItem ? (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-gray-500">Producto</div>
                <div className="font-semibold">
                  {detailItem.producto?.nombre || `ID ${detailItem.producto_id}`}
                </div>
                <div className="text-gray-500">SKU: {detailItem.producto?.codigo_sku ?? "—"}</div>
              </div>
              <div>
                <div className="text-gray-500">Estado</div>
                <EstadoBadge value={detailItem.estado} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-gray-500">Origen</div>
                <div className="font-medium">
                  {detailItem.local_origen?.nombre || detailItem.local_origen_id}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Destino</div>
                <div className="font-medium">
                  {detailItem.local_destino?.nombre || detailItem.local_destino_id}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>Solicitada: <b>{detailItem.cantidad_solicitada}</b></div>
              <div>Preparada: <b>{detailItem.cantidad_preparada}</b></div>
              <div>Enviada: <b>{detailItem.cantidad_enviada}</b></div>
              <div>Recibida: <b>{detailItem.cantidad_recibida}</b></div>
            </div>

            <div>
              <div className="text-gray-500">Observaciones</div>
              <div className="whitespace-pre-wrap">{detailItem.observaciones || "—"}</div>
            </div>

            <div className="text-gray-500">
              Creado: {new Date(detailItem.created_at).toLocaleString("es-AR")}
            </div>
          </div>
        ) : (
          <div>Cargando...</div>
        )}
      </Modal>

      {/* MODAL: Cantidades */}
      <Modal
        open={openQty}
        onClose={() => setOpenQty(false)}
        title={`Editar cantidades • Pedido #${qtyItem?.id ?? ""}`}
        size="max-w-md"
      >
        <form onSubmit={submitQty} className="grid grid-cols-1 gap-4">
          <input
            type="number"
            min={0}
            max={qtyItem?.cantidad_solicitada ?? undefined}
            className="border rounded-lg px-3 py-2"
            placeholder="Cantidad preparada"
            value={qtyForm.cantidad_preparada}
            onChange={(e) =>
              setQtyForm((f) => ({ ...f, cantidad_preparada: e.target.value }))
            }
          />
          <input
            type="number"
            min={0}
            max={qtyForm.cantidad_preparada || qtyItem?.cantidad_preparada || undefined}
            className="border rounded-lg px-3 py-2"
            placeholder="Cantidad enviada"
            value={qtyForm.cantidad_enviada}
            onChange={(e) =>
              setQtyForm((f) => ({ ...f, cantidad_enviada: e.target.value }))
            }
          />
          <input
            type="number"
            min={0}
            max={qtyForm.cantidad_enviada || qtyItem?.cantidad_enviada || undefined}
            className="border rounded-lg px-3 py-2"
            placeholder="Cantidad recibida"
            value={qtyForm.cantidad_recibida}
            onChange={(e) =>
              setQtyForm((f) => ({ ...f, cantidad_recibida: e.target.value }))
            }
          />
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setOpenQty(false)}
              className="px-4 py-2 rounded-lg border hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Guardar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ================== MENÚ DE ESTADO ==================
function EstadoMenu({ row, onChangeEstado }) {
  const [open, setOpen] = useState(false);

  // mismas transiciones que el backend
  const opciones = useMemo(() => {
    const map = {
      pendiente: ["visto", "cancelado"],
      visto: ["preparacion", "cancelado"],
      preparacion: ["enviado", "cancelado"],
      enviado: ["entregado"],
      entregado: [],
      cancelado: [],
    };
    return map[row.estado] || [];
  }, [row.estado]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="px-3 py-1.5 rounded-lg border hover:bg-gray-50 text-gray-700"
        title="Cambiar estado"
      >
        <FaEllipsisV />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute right-0 mt-2 w-44 bg-white border rounded-xl shadow-lg z-10 overflow-hidden"
          >
            {opciones.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">Sin acciones</div>
            ) : (
              opciones.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    setOpen(false);
                    onChangeEstado(row, opt);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                >
                  {ESTADO_EMOJI[opt]} {opt}
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
