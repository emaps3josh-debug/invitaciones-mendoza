// Catálogos y etiquetas compartidas entre la ficha y el panel

export const TIPOS_EVENTO = ["Boda", "XV años", "Cumpleaños", "Bautizo", "Primera comunión", "Baby shower", "Graduación", "Otro"];

export const ESTILOS = ["Elegante", "Minimalista", "Temática", "Infantil", "Otro"];

export const FUNCIONES = [
  "Cuenta regresiva para el evento",
  "Botón de ubicación con Google Maps",
  "Confirmación de asistencia por WhatsApp",
  "Música de fondo",
  "Itinerario del evento",
  "Galería de fotografías",
  "Botón para enviar mensaje a los anfitriones",
  "Formulario de confirmación de asistencia",
];

export const ESTADOS = {
  nueva: "Nueva",
  diseno: "En diseño",
  entregada: "Entregada",
};

// Estructura vacía de una ficha
export const fichaVacia = () => ({
  contacto: { nombre: "", whatsapp: "" },
  evento: { tipo: "", festejado: "", edad: "", anfitriones: "", fecha: "", hora: "", lugar: "", direccion: "", maps: "", vestimenta: "" },
  diseno: { estilo: "", estiloOtro: "", tematica: "", colores: "", fotosPersonales: "", frase: "", textoAdicional: "", referenciasTexto: "" },
  funciones: [],
  funcionOtra: "",
  confirmacion: { responsable: "", whatsapp: "", fechaLimite: "", cuantasPersonas: "", nombreAsistentes: "" },
  itinerario: { ceremonia: "", recepcion: "", comida: "", vals: "", otros: "" },
  material: { enlaceFotos: "", canciones: "", textosExactos: "" },
});

// Etiquetas para mostrar la ficha en el panel (en el mismo orden que el formulario)
export const ETIQUETAS = [
  { titulo: "Datos de contacto", clave: "contacto", campos: { nombre: "Nombre", whatsapp: "WhatsApp" } },
  {
    titulo: "1. Datos del evento", clave: "evento",
    campos: {
      tipo: "Tipo de evento", festejado: "Festejado(a)", edad: "Edad que cumple", anfitriones: "Novios / anfitriones",
      fecha: "Fecha", hora: "Hora de inicio", lugar: "Lugar", direccion: "Dirección", maps: "Google Maps", vestimenta: "Código de vestimenta",
    },
  },
  {
    titulo: "2. Diseño y temática", clave: "diseno",
    campos: {
      estilo: "Estilo", estiloOtro: "Otro estilo", tematica: "Temática o personajes", colores: "Colores",
      fotosPersonales: "Fotografías personales", referenciasTexto: "Referencias del diseño", frase: "Frase o mensaje", textoAdicional: "Texto adicional",
    },
  },
  {
    titulo: "4. Confirmación de asistencia", clave: "confirmacion",
    campos: {
      responsable: "Recibe confirmaciones", whatsapp: "WhatsApp", fechaLimite: "Fecha límite",
      cuantasPersonas: "¿Indicar cuántas personas?", nombreAsistentes: "¿Pedir nombre de cada asistente?",
    },
  },
  {
    titulo: "5. Itinerario", clave: "itinerario",
    campos: { ceremonia: "Ceremonia", recepcion: "Recepción", comida: "Comida o cena", vals: "Vals o brindis", otros: "Otros momentos" },
  },
  { titulo: "6. Material", clave: "material", campos: { enlaceFotos: "Carpeta de fotos", canciones: "Canciones", textosExactos: "Textos exactos" } },
];

// Convierte un WhatsApp de 10 dígitos (México) a formato wa.me
export const waLink = (numero, texto = "") => {
  let n = String(numero || "").replace(/\D/g, "");
  if (n.length === 10) n = "52" + n;
  return `https://wa.me/${n}${texto ? `?text=${encodeURIComponent(texto)}` : ""}`;
};
