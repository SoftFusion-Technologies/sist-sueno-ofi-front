const formatearFechaARG = (fecha) => {
  if (!fecha) return '-';
  const f = new Date(fecha);
  return isNaN(f)
    ? '-'
    : f.toLocaleDateString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires'
      });
};

export default formatearFechaARG;
