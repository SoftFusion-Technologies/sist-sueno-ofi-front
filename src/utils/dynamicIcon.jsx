import * as FaIcons from 'react-icons/fa'; // FontAwesome
import * as MdIcons from 'react-icons/md'; // Material Design
import * as BsIcons from 'react-icons/bs'; // Bootstrap
import * as FiIcons from 'react-icons/fi'; // Feather
import * as AiIcons from 'react-icons/ai'; // AntDesign
import * as IoIcons from 'react-icons/io'; // Ionicons
import * as GiIcons from 'react-icons/gi'; // Game Icons
import * as BiIcons from 'react-icons/bi'; // BoxIcons
// Agregá más si necesitás...

// Mapeo prefijo → librería importada
const ICON_LIBRARIES = {
  Fa: FaIcons,
  Md: MdIcons,
  Bs: BsIcons,
  Fi: FiIcons,
  Ai: AiIcons,
  Io: IoIcons,
  Gi: GiIcons,
  Bi: BiIcons
  // Sumá aquí los prefijos que uses
};

/**
 * Devuelve el componente de icono React correspondiente a un nombre, por ejemplo:
 *  "FaCreditCard", "MdPayment", "BsWallet", etc.
 * Si no encuentra el icono en la librería indicada, retorna null.
 *
 * @param {string} nombre Nombre exacto del icono, con prefijo, ej: "FaCreditCard"
 * @param {object} props Props opcionales para pasar al icono (ej: className, style)
 */
export function dynamicIcon(nombre, props = {}) {
  if (!nombre || typeof nombre !== 'string') return null;
  const prefix = nombre.slice(0, 2); // Ej: "Fa", "Md", etc
  const lib = ICON_LIBRARIES[prefix];
  if (!lib) return null;
  const Icon = lib[nombre];
  return Icon ? <Icon {...props} /> : null;
}
