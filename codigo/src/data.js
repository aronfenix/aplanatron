'use strict';
/* =====================================================================
   CONTENIDOS DEL TEMA 1 · «COMO AQUÍ, PERO ALLÍ»
   Solo lo que hay que estudiar. Todo el texto del juego está en este bloque
   y se puede editar sin tocar el resto del código.
   Coordenadas en grados: [latitud, longitud].
   ===================================================================== */

/* ---------- CAPÍTULO 1 · LOS NOMBRES VOLADOS (mares, península e islas) ---------- */
// zona: dónde hay que soltar el cartel
const NOMBRES = [
  { id: 'peninsula', name: 'Península Ibérica', zone: { type: 'land' }, hint: 'La península Ibérica es la tierra donde están España y Portugal. Suelta el cartel en tierra firme, en medio de la península.' },
  { id: 'cantabrico', name: 'Mar Cantábrico', zone: { type: 'sea', sea: 'cantabrico' }, hint: 'El mar Cantábrico está al NORTE de España. Tendrás que ir en barco.' },
  { id: 'atlantico', name: 'Océano Atlántico', zone: { type: 'sea', sea: 'atlantico' }, hint: 'El océano Atlántico está al OESTE de la península (también baña el suroeste y las Canarias).' },
  { id: 'mediterraneo', name: 'Mar Mediterráneo', zone: { type: 'sea', sea: 'mediterraneo' }, hint: 'El mar Mediterráneo está al ESTE y al SURESTE de España.' },
  { id: 'baleares', name: 'Islas Baleares', zone: { type: 'circle', at: [39.55, 2.8], r: 95 }, hint: 'Las islas Baleares están en el mar Mediterráneo, al ESTE de la península.' },
  { id: 'canarias', name: 'Islas Canarias', zone: { type: 'inset' }, hint: 'Las islas Canarias están en el océano Atlántico, cerca de África. En los mapas aparecen dentro de un recuadro, abajo a la izquierda.' },
];

/* ---------- CAPÍTULO 2 · LAS ARRUGAS (relieve) ---------- */
// keys: cordilleras del mapa que forman ese sistema
const RELIEVE = [
  { id: 'pirineos', name: 'los Pirineos', keys: ['pirineos'], hint: 'Los Pirineos están en el NORESTE. Separan España de Francia: son una frontera natural.', fact: '¡Los Pirineos, la frontera natural con Francia!' },
  { id: 'cantabrica', name: 'la Cordillera Cantábrica', keys: ['cantabrica'], hint: 'La Cordillera Cantábrica está en el NORTE, pegada al mar Cantábrico.', fact: '¡La Cordillera Cantábrica, junto al mar Cantábrico!' },
  { id: 'iberico', name: 'el Sistema Ibérico', keys: ['iberico'], hint: 'El Sistema Ibérico está al ESTE de la Meseta. Va de noroeste a sureste.', fact: '¡El Sistema Ibérico! De aquí nacen el Duero y el Tajo.' },
  { id: 'central', name: 'el Sistema Central', keys: ['central'], hint: 'El Sistema Central está en el CENTRO, al norte de Madrid. Parte la Meseta en dos.', fact: '¡El Sistema Central, que parte la Meseta en dos!' },
  { id: 'beticos', name: 'los Sistemas Béticos', keys: ['penibetico', 'subbetico'], hint: 'Los Sistemas Béticos están en el SUR, en Andalucía, cerca del Mediterráneo.', fact: '¡Los Sistemas Béticos, en el sur!' },
  { id: 'meseta', name: 'la Meseta Central', area: 'meseta', hint: 'La Meseta Central ocupa el CENTRO de la península. Es una llanura muy grande y alta.', fact: '¡La Meseta Central: una llanura alta en el centro!' },
];
const DEPRESION = { id: 'depresion', name: 'Depresión del Ebro', zone: { type: 'depr', depr: 'ebro' }, hint: 'La depresión del Ebro es una zona baja entre los Pirineos y el Sistema Ibérico. Por ella pasa el río Ebro.' };

/* ---------- CAPÍTULO 3 · RÍOS SIN AGUA ---------- */
// nace: en qué sistema está su nacimiento · mar: dónde desemboca
const RIOS = [
  { id: 'Duero', nace: 'iberico', naceTxt: 'el Sistema Ibérico', mar: 'atlantico', source: [41.98, -2.9], hint: 'El Duero nace en el Sistema Ibérico (en los Picos de Urbión), cruza la Meseta hacia el oeste y desemboca en el océano Atlántico, en Oporto (Portugal).' },
  { id: 'Tajo', nace: 'iberico', naceTxt: 'el Sistema Ibérico', mar: 'atlantico', source: [40.52, -1.68], hint: 'El Tajo nace en el Sistema Ibérico (en los Montes Universales), pasa por Toledo y desemboca en el océano Atlántico, en Lisboa (Portugal). Es el río más largo de la península.' },
  { id: 'Ebro', nace: 'cantabrica', naceTxt: 'la Cordillera Cantábrica', mar: 'mediterraneo', source: [43.0, -4.3], hint: 'El Ebro nace en la Cordillera Cantábrica (en Fontibre, Cantabria), va hacia el sureste por la depresión del Ebro y desemboca en el mar Mediterráneo formando un delta.' },
];
// fuentes falsas (secas) en otros sistemas para despistar: [lat, lon, sistema]
const FUENTES_FALSAS = [[40.78, -4.0, 'central'], [37.08, -3.35, 'beticos'], [42.68, 0.6, 'pirineos'], [43.05, -6.0, 'cantabrica'], [40.3, -5.3, 'central']];
const RIOS_NORTE = ['Nalón', 'Navia', 'Eo', 'Nervión', 'Bidasoa'];
const RIOS_NORTE_RASGOS = { ok: ['cortos', 'rápidos', 'caudalosos'], ko: ['largos', 'lentos', 'con poca agua'] };
const MARES = { cantabrico: 'Mar Cantábrico', atlantico: 'Océano Atlántico', mediterraneo: 'Mar Mediterráneo' };

/* ---------- CAPÍTULO 4 · FAROS Y COSTAS ---------- */
const COSTAS = [
  { id: 'finisterre', name: 'el cabo de Finisterre', kind: 'faro', at: [42.88, -9.27], hint: 'Finisterre está en Galicia, en el extremo OESTE de España. Los romanos creían que allí se acababa la Tierra: «finis terrae», el fin de la tierra.' },
  { id: 'cadiz', name: 'el golfo de Cádiz', kind: 'boya', zone: { type: 'circle', at: [36.62, -6.85], r: 70 }, hint: 'El golfo de Cádiz es una gran entrada del mar en la costa del SUROESTE, en el océano Atlántico. Un golfo es eso: el mar metiéndose en la tierra.' },
  { id: 'estrecho', name: 'el estrecho de Gibraltar', kind: 'paso', at: [35.97, -5.55], hint: 'El estrecho de Gibraltar está en el SUR. Es el paso de mar estrechito entre España y África, que une el océano Atlántico con el mar Mediterráneo.' },
  { id: 'delta', name: 'el delta del Ebro', kind: 'boya', zone: { type: 'circle', at: [40.64, 0.98], r: 50 }, hint: 'El delta del Ebro está en el ESTE, donde el río Ebro llega al Mediterráneo y deja tanta tierra que forma un triángulo en el mar.' },
];
// faros apagados que despistan
const FAROS_FALSOS = [[43.79, -7.69], [43.66, -5.85], [42.32, 3.32], [36.72, -2.19], [37.63, -0.69], [43.45, -2.75]];

/* ---------- CAPÍTULO 5 · EL TIEMPO LOCO (climas) ---------- */
const CLIMAS = {
  oceanico: { name: 'Clima oceánico', col: '#46c97a', temp: 'Temperaturas suaves todo el año: ni mucho frío ni mucho calor.', lluvia: 'Llueve mucho durante todo el año.', veg: 'Bosques muy verdes y praderas.', donde: 'el norte: Galicia y la costa del Cantábrico' },
  mediterraneo: { name: 'Clima mediterráneo', col: '#ffb938', temp: 'Veranos muy calurosos. Inviernos suaves en la costa y fríos en el interior.', lluvia: 'Llueve poco, sobre todo en verano.', veg: 'Árboles y matorrales que aguantan la sequía.', donde: 'casi toda España: el centro, el este y el sur' },
  montana: { name: 'Clima de montaña', col: '#9b7bf0', temp: 'Inviernos largos y muy fríos. Veranos cortos y frescos.', lluvia: 'Llueve y nieva mucho.', veg: 'Bosques de árboles con forma de cono y prados de alta montaña.', donde: 'las montañas altas, como los Pirineos' },
  subtropical: { name: 'Clima subtropical', col: '#ff6f91', temp: 'Calor todo el año, también en invierno.', lluvia: 'Llueve muy poco.', veg: 'Plantas que aguantan mucho calor y poca agua.', donde: 'las islas Canarias' },
};
// estaciones del tiempo: dónde están y qué clima tienen
const ESTACIONES = [
  { id: 'eNorte', label: 'Estación del norte', at: [43.2, -6.6], clima: 'oceanico', loco: 'sol' },
  { id: 'eCentro', label: 'Estación del centro', at: [39.9, -3.0], clima: 'mediterraneo', loco: 'nieve' },
  { id: 'eMonte', label: 'Estación de la montaña', at: [42.62, 0.3], clima: 'montana', loco: 'calor' },
  { id: 'eCanarias', label: 'Estación de Canarias', cat: [28.35, -16.3], clima: 'subtropical', loco: 'nieve' },
];

/* ---------- CAPÍTULO 6 · EUROPA (en globo) ---------- */
// type: pt (zona redonda) · range (cordillera aplastada) · river (cartel en el río)
const EUROPA = [
  { id: 'pIberica', name: 'Península Ibérica', type: 'pt', at: [40.0, -4.0], r: 95, hint: 'La península Ibérica es la nuestra: España y Portugal, en el SUROESTE de Europa.' },
  { id: 'pItalica', name: 'Península Itálica', type: 'pt', at: [42.3, 13.0], r: 70, hint: 'La península Itálica tiene forma de bota: es Italia, en el SUR de Europa, en medio del Mediterráneo.' },
  { id: 'pBalcanica', name: 'Península Balcánica', type: 'pt', at: [42.3, 22.5], r: 90, hint: 'La península Balcánica está en el SURESTE de Europa. Grecia está en su punta.' },
  { id: 'pEscandinava', name: 'Península Escandinava', type: 'pt', at: [63.5, 15.5], r: 110, hint: 'La península Escandinava está en el NORTE de Europa: Noruega y Suecia.' },
  { id: 'granBretana', name: 'Gran Bretaña', type: 'pt', at: [53.5, -1.8], r: 55, hint: 'Gran Bretaña es la isla grande del NOROESTE, frente a Francia. Allí está Londres.' },
  { id: 'irlanda', name: 'Irlanda', type: 'pt', at: [53.2, -8.0], r: 40, hint: 'Irlanda es la isla que está al oeste de Gran Bretaña.' },
  { id: 'islandia', name: 'Islandia', type: 'pt', at: [64.9, -18.6], r: 55, hint: 'Islandia es una isla muy al NOROESTE, en medio del océano Atlántico, cerca del círculo polar.' },
  { id: 'granLlanura', name: 'Gran Llanura Europea', type: 'pt', at: [52.5, 16.0], r: 120, hint: 'La Gran Llanura Europea ocupa el CENTRO y el NORTE de Europa: Alemania, Polonia… Es enorme y muy plana.' },
  { id: 'alpes', name: 'los Alpes', type: 'range', key: 'alpes', hint: 'Los Alpes están en el centro-sur de Europa, entre Francia, Suiza, Italia y Austria. Son las montañas más famosas de Europa.' },
  { id: 'urales', name: 'los Urales', type: 'range', key: 'urales', hint: 'Los montes Urales están en el ESTE, en Rusia. Marcan la frontera entre Europa y Asia.' },
  { id: 'Rin', name: 'Río Rin', type: 'river', key: 'Rin', hint: 'El Rin nace en los Alpes y va hacia el NORTE hasta el mar del Norte, pasando por Alemania.' },
  { id: 'Danubio', name: 'Río Danubio', type: 'river', key: 'Danubio', hint: 'El Danubio cruza Europa de oeste a ESTE, pasa por Viena y desemboca en el mar Negro.' },
];

/* ---------- JEFE FINAL · preguntas de repaso (la primera respuesta es la correcta) ---------- */
const REPASO = [
  { id: 'q1', q: '¿Qué montañas separan España de Francia?', a: 'Pirineos', b: 'Sistema Central', c: 'Béticos' },
  { id: 'q2', q: '¿Qué mar está al norte de España?', a: 'Cantábrico', b: 'Mediterráneo', c: 'Negro' },
  { id: 'q3', q: '¿Qué mar está al este de España?', a: 'Mediterráneo', b: 'Cantábrico', c: 'Atlántico' },
  { id: 'q4', q: '¿Qué océano baña el oeste de la península?', a: 'Atlántico', b: 'Pacífico', c: 'Índico' },
  { id: 'q5', q: '¿Dónde desemboca el Ebro?', a: 'Mediterráneo', b: 'Atlántico', c: 'Cantábrico' },
  { id: 'q6', q: '¿Dónde desemboca el Duero?', a: 'Atlántico', b: 'Mediterráneo', c: 'Cantábrico' },
  { id: 'q7', q: '¿Dónde desemboca el Tajo?', a: 'Atlántico', b: 'Mediterráneo', c: 'Cantábrico' },
  { id: 'q8', q: '¿Dónde nace el Ebro?', a: 'Cordillera Cantábrica', b: 'Sistema Central', c: 'Pirineos' },
  { id: 'q9', q: '¿Dónde nacen el Duero y el Tajo?', a: 'Sistema Ibérico', b: 'Béticos', c: 'Pirineos' },
  { id: 'q10', q: '¿Qué parte la Meseta en dos?', a: 'Sistema Central', b: 'Pirineos', c: 'Sistema Ibérico' },
  { id: 'q11', q: '¿Cómo son los ríos del norte?', a: 'Cortos, rápidos y caudalosos', b: 'Largos y lentos', c: 'Largos y con poca agua' },
  { id: 'q12', q: '¿Cuál es el pico más alto de España?', a: 'El Teide', b: 'El Aneto', c: 'El Moncayo' },
  { id: 'q13', q: '¿Dónde está el Teide?', a: 'Canarias', b: 'Baleares', c: 'Pirineos' },
  { id: 'q14', q: '¿Qué une el Atlántico y el Mediterráneo?', a: 'Estrecho de Gibraltar', b: 'Golfo de Cádiz', c: 'Delta del Ebro' },
  { id: 'q15', q: 'El golfo de Cádiz está en el…', a: 'Suroeste', b: 'Noreste', c: 'Norte' },
  { id: 'q16', q: '¿Qué forma el Ebro al llegar al mar?', a: 'Un delta', b: 'Un golfo', c: 'Un estrecho' },
  { id: 'q17', q: 'El cabo de Finisterre está en el…', a: 'Oeste', b: 'Este', c: 'Sur' },
  { id: 'q18', q: 'Llueve mucho todo el año y es verde:', a: 'Oceánico', b: 'Mediterráneo', c: 'Subtropical' },
  { id: 'q19', q: 'Calor todo el año, en Canarias:', a: 'Subtropical', b: 'De montaña', c: 'Oceánico' },
  { id: 'q20', q: 'Veranos calurosos y pocas lluvias:', a: 'Mediterráneo', b: 'Oceánico', c: 'De montaña' },
  { id: 'q21', q: 'Inviernos largos, fríos y con nieve:', a: 'De montaña', b: 'Subtropical', c: 'Mediterráneo' },
  { id: 'q22', q: '¿Qué montes separan Europa de Asia?', a: 'Urales', b: 'Alpes', c: 'Pirineos' },
  { id: 'q23', q: '¿Qué península tiene forma de bota?', a: 'Itálica', b: 'Escandinava', c: 'Balcánica' },
  { id: 'q24', q: '¿Qué península está en el norte de Europa?', a: 'Escandinava', b: 'Itálica', c: 'Ibérica' },
  { id: 'q25', q: '¿Qué río cruza Europa hasta el mar Negro?', a: 'Danubio', b: 'Rin', c: 'Tajo' },
  { id: 'q26', q: '¿Qué isla está al oeste de Gran Bretaña?', a: 'Irlanda', b: 'Islandia', c: 'Mallorca' },
  { id: 'q27', q: '¿En qué mar están las Baleares?', a: 'Mediterráneo', b: 'Atlántico', c: 'Cantábrico' },
  { id: 'q28', q: 'La zona baja entre Pirineos y S. Ibérico es la…', a: 'Depresión del Ebro', b: 'Meseta Central', c: 'Península' },
  { id: 'q29', q: '¿Qué río pasa por Alemania y acaba en el mar del Norte?', a: 'Rin', b: 'Danubio', c: 'Ebro' },
  { id: 'q30', q: '¿Cómo se llama la gran zona llana del norte de Europa?', a: 'Gran Llanura Europea', b: 'Alpes', c: 'Meseta Central' },
  { id: 'q31', q: '¿Qué montañas altísimas están en el centro de Europa?', a: 'Alpes', b: 'Urales', c: 'Béticos' },
  { id: 'q32', q: '¿Qué isla de Europa está muy al norte y tiene volcanes?', a: 'Islandia', b: 'Irlanda', c: 'Mallorca' },
  { id: 'q33', q: '¿Qué península está al este de la Itálica?', a: 'Balcánica', b: 'Ibérica', c: 'Escandinava' },
  { id: 'q34', q: '¿Qué países forman la península Ibérica?', a: 'España y Portugal', b: 'España y Francia', c: 'Italia y Grecia' },
  { id: 'q35', q: '¿Qué ocupa el centro de la península?', a: 'Meseta Central', b: 'Depresión del Ebro', c: 'Golfo de Cádiz' },
  { id: 'q36', q: '¿Qué montañas están en el sur, en Andalucía?', a: 'Sistemas Béticos', b: 'Pirineos', c: 'Cordillera Cantábrica' },
  { id: 'q37', q: '¿Qué cordillera está junto al mar Cantábrico?', a: 'Cordillera Cantábrica', b: 'Sistema Central', c: 'Sistemas Béticos' },
  { id: 'q38', q: '¿Qué montañas bordean la Meseta por el este?', a: 'Sistema Ibérico', b: 'Pirineos', c: 'Alpes' },
];

/* ---------- VOCABULARIO (misión de los globos en el cole) ---------- */
const VOCAB = [
  { id: 'montana', word: 'montaña', scene: 'montana', def: 'Gran elevación del terreno.' },
  { id: 'llanura', word: 'llanura', scene: 'llanura', def: 'Zona plana situada a poca altura sobre el nivel del mar.' },
  { id: 'meseta', word: 'meseta', scene: 'meseta', def: 'Zona plana situada a gran altura.' },
  { id: 'valle', word: 'valle', scene: 'valle', def: 'Terreno hundido entre montañas por el que suele pasar un río.' },
  { id: 'peninsula', word: 'península', scene: 'peninsula', def: 'Extensión de tierra rodeada de agua por todas partes menos por una.' },
  { id: 'isla', word: 'isla', scene: 'isla', def: 'Extensión de tierra rodeada de agua por todas partes.' },
  { id: 'archipielago', word: 'archipiélago', scene: 'archipielago', def: 'Conjunto de islas próximas entre sí.' },
  { id: 'golfo', word: 'golfo', scene: 'golfo', def: 'Gran entrada del mar en la costa.' },
  { id: 'cabo', word: 'cabo', scene: 'cabo', def: 'Punta de tierra que se introduce en el mar.' },
  { id: 'playa', word: 'playa', scene: 'playa', def: 'Zona llana de la costa formada por arena o piedras.' },
  { id: 'acantilado', word: 'acantilado', scene: 'acantilado', def: 'Pared de roca muy empinada donde la tierra se junta con el mar.' },
  { id: 'ria', word: 'ría', scene: 'ria', def: 'Golfo que se forma en el valle de un río.' },
  { id: 'afluente', word: 'afluente', scene: 'afluente', def: 'Río que desemboca en otro río en lugar de en el mar.' },
  { id: 'caudal', word: 'caudal', def: 'Cantidad de agua que lleva un río.' },
  { id: 'vertiente', word: 'vertiente', def: 'Territorio por el que pasan los ríos que desembocan en el mismo mar u océano.' },
  { id: 'altitud', word: 'altitud', def: 'Altura de un lugar medida desde el nivel del mar.' },
  { id: 'relieve', word: 'relieve', def: 'Conjunto de formas que tiene la superficie de la Tierra.' },
  { id: 'depresion', word: 'depresión', def: 'Valle muy extenso.' },
  { id: 'cordillera', word: 'cordillera', def: 'Conjunto de sierras: muchas montañas en fila.' },
];
const VOCAB_FAMILY = [['montana', 'meseta', 'llanura', 'valle', 'depresion', 'cordillera', 'altitud'], ['peninsula', 'isla', 'archipielago', 'cabo'], ['golfo', 'cabo', 'ria', 'playa', 'acantilado'], ['afluente', 'caudal', 'vertiente', 'relieve']];
const CLAVES = ('RIO CABO ISLA GOLFO PLAYA DELTA MONTE SIERRA VALLE LAGO MAR OLA ROCA PICO NIEVE LLUVIA NUBE SOL VIENTO ROBLE HAYA PINO ENCINA DRAGO ABETO MUSGO PALMERA ROMERO TOMILLO FARO BARCO PUERTO ' +
  'ARENA PIEDRA VOLCAN LAVA CUEVA BOSQUE PRADO CAMPO COLINA CUMBRE LADERA FUENTE ARROYO CASCADA PUENTE MAPA BRUJULA NORTE SUR ESTE OESTE TRUENO RAYO HIELO GRANIZO NIEBLA BRISA TORMENTA VERANO ' +
  'INVIERNO CIELO LUNA ESTRELLA COMETA PLANETA TIERRA AGUA FUEGO AIRE CABRA OVEJA VACA LOBO OSO AGUILA BUHO ZORRO CIERVO LINCE ERIZO TORTUGA DELFIN BALLENA GAVIOTA PULPO CANGREJO FOCA PINGUINO CAMELLO ' +
  'LAGARTO RANA PATO GALLO BURRO MOCHILA TIZA LAPIZ GOMA REGLA LIBRO CUADERNO PIZARRA GLOBO COHETE TREN AVION BICI TAMBOR GAITA GUITARRA CASTILLO TORRE MOLINO GRANJA HUERTO OLIVO UVA NARANJA LIMON MELON PERA ' +
  'QUESO CHURRO TORTILLA PAELLA GARBANZO').split(' ');

/* ---------- guion ---------- */
// who: alvaro | rosa | teide | narrador · face: expresión
const GUION = {
  hub1: [
    { who: 'rosa', face: 'happy', text: '¡Hola, {A}! Estáis dentro del mapa de la clase. Yo soy Rosa, la rosa de los vientos: siempre sé dónde está el NORTE.' },
    { who: 'rosa', face: 'worried', text: 'El Aplanatrón lo ha dejado todo liso: sin montañas, sin ríos, sin nombres. Pero Álvaro se ha dejado pruebas escondidas por el mapa.' },
    { who: 'rosa', face: 'talk', text: 'Caminad por el mapa y entrad en las pruebas en el orden que queráis. Cada una que superéis devuelve algo a España.' },
    { who: 'alvaro', face: 'shock', text: '¿Devolver cosas a España? ¡Pero entonces el examen volverá a tener 47 preguntas! ¡Y tendré que CORREGIRLAS!' },
    { who: 'rosa', face: 'proud', text: 'Exacto. Cuando las superéis todas, se abrirá el puerto del sur: la prueba final.' },
    { who: 'rosa', face: 'happy', text: 'Y si queréis repasar la teoría, en el MENÚ está mi cine: VÍDEOS con lo más importante del tema.' },
  ],
  final: [
    { who: 'alvaro', face: 'angry', text: '¡Basta! Me habéis devuelto montañas, ríos, costas, climas y hasta Europa. ¡El examen ya tiene 47 preguntas otra vez!' },
    { who: 'alvaro', face: 'evil', text: 'Última oportunidad: el Aplanatrón ha vuelto a aplastar unas cuantas cosas por todo el mapa. Y luego me voy a por el Teide.' },
    { who: 'rosa', face: 'talk', text: 'Esta vez no hay pruebas: hay que arreglarlo todo a pie, en barco y con prisa. Seguid mis instrucciones.' },
  ],
  boss: [
    { who: 'alvaro', face: 'evil', text: 'Solo queda una montaña que el Aplanatrón no ha podido aplastar: el Teide. Y hoy… ¡lo voy a aplanar!' },
    { who: 'teide', face: 'shout', text: '¡Que lo intente! Yo os lanzo bolas de lava con respuestas. Coged la correcta y lanzádsela al Aplanatrón.' },
  ],
  teide: [
    { who: 'teide', face: 'proud', text: '¡Hombre, visitas! Soy el Teide: 3 718 metros. El pico más alto de España.' },
    { who: 'teide', face: 'happy', text: 'A mí no me pudo aplanar: soy un volcán y quemo. ¡Al Aplanatrón se le derritió el rodillo!' },
  ],
  fin: [
    { who: 'narrador', text: 'El Aplanatrón 3000 salió volando, dio tres vueltas sobre el Atlántico y cayó al mar con un «¡PLOF!».' },
    { who: 'rosa', face: 'happy', text: '¡Lo habéis conseguido! El mapa vuelve a tener montañas, ríos, costas y nombres. ¡Hora de volver a clase!' },
  ],
};
const PULLAS = {
  gloat: ['¡JA! ¡Esa no era!', '¡Una pregunta menos que corregir!', '¡Más perdidos que un pingüino en Sevilla!', '¡Así el examen será cortito!', '¡Eso no viene ni en mi libro!', '¡Mi boli rojo descansa tranquilo!'],
  hurt: ['¡AY! ¡Otra pregunta para el examen!', '¡Imposible!', '¡Habéis estudiado! ¡Traición!', '¡Mis tardes libres!', '¡Eso ha sido suerte!', '¿Quién os ha enseñado eso? ¡Ah, yo!', '¡Noooo, más cosas que corregir!'],
};
const ESQUEMA = [
  { ch: 1, t: 0, title: 'Mares, península e islas', col: '#3ec1f3', rows: [
    ['Península Ibérica', 'España y Portugal. Rodeada de agua por todas partes menos por una: por los Pirineos se une a Europa.'],
    ['Mares y océano', 'NORTE: mar Cantábrico. OESTE y suroeste: océano Atlántico. ESTE y sureste: mar Mediterráneo.'],
    ['Islas', 'Baleares: en el Mediterráneo. Canarias: en el Atlántico, cerca de África.'],
  ] },
  { ch: 2, t: 1, title: 'El relieve', col: '#c98c5a', rows: [
    ['Meseta Central', 'Llanura alta en el centro. El Sistema Central la parte en dos.'],
    ['Montañas', 'Pirineos (frontera natural con Francia) · Cordillera Cantábrica (norte) · Sistema Ibérico (este) · Sistema Central (centro) · Sistemas Béticos (sur).'],
    ['Depresión del Ebro', 'Zona baja entre los Pirineos y el Sistema Ibérico. Por ella pasa el Ebro.'],
    ['El Teide', 'En Tenerife (Canarias). 3 718 m: el pico más alto de España.'],
  ] },
  { ch: 3, t: 2, title: 'Los ríos', col: '#3e8ef0', rows: [
    ['Duero', 'Nace en el Sistema Ibérico. Desemboca en el océano Atlántico (Oporto).'],
    ['Tajo', 'Nace en el Sistema Ibérico. Desemboca en el océano Atlántico (Lisboa). El más largo.'],
    ['Ebro', 'Nace en la Cordillera Cantábrica. Desemboca en el mar Mediterráneo y forma un delta.'],
    ['Ríos del norte', 'Van al Cantábrico: cortos, rápidos y caudalosos.'],
  ] },
  { ch: 4, t: 0, title: 'Las costas', col: '#2fb8a0', rows: [
    ['Cabo de Finisterre', 'Un cabo: punta de tierra que entra en el mar. En el extremo oeste, en Galicia.'],
    ['Golfo de Cádiz', 'Un golfo: gran entrada del mar en la costa. En el suroeste, en el Atlántico.'],
    ['Estrecho de Gibraltar', 'Un estrecho: paso de mar entre dos tierras. Separa España de África y une el Atlántico con el Mediterráneo.'],
    ['Delta del Ebro', 'Un delta: tierra que deja el río en su desembocadura. En el Mediterráneo.'],
  ] },
  { ch: 5, t: 3, title: 'Los climas', col: '#ffb938', rows: [
    ['Oceánico', 'Norte. Temperaturas suaves y lluvia todo el año. Bosques verdes y praderas.'],
    ['Mediterráneo', 'Casi toda España. Veranos calurosos y pocas lluvias. Árboles y matorrales que aguantan la sequía.'],
    ['De montaña', 'Montañas altas. Inviernos largos y fríos, mucha nieve. Árboles con forma de cono y prados.'],
    ['Subtropical', 'Canarias. Calor todo el año y muy poca lluvia. Plantas que aguantan calor y sequía.'],
  ] },
  { ch: 6, t: 4, title: 'Europa', col: '#a66cff', rows: [
    ['Penínsulas', 'Ibérica (suroeste), Itálica (sur, con forma de bota), Balcánica (sureste) y Escandinava (norte).'],
    ['Islas', 'Gran Bretaña, Irlanda e Islandia.'],
    ['Relieve', 'La Gran Llanura Europea en el centro y el norte. Los Alpes, en el centro-sur. Los Urales, en el este: frontera con Asia.'],
    ['Ríos', 'El Rin va al norte, hasta el mar del Norte. El Danubio va al este, hasta el mar Negro.'],
  ] },
  { ch: 8, t: 5, title: 'Palabras del relieve', col: '#ff5c8a', rows: [
    ['Montaña · llanura · meseta', 'Gran elevación · zona plana y baja · zona plana y alta.'],
    ['Valle · depresión', 'Terreno hundido entre montañas · valle muy extenso.'],
    ['Península · isla · archipiélago', 'Agua por todas partes menos por una · por todas partes · grupo de islas.'],
    ['Golfo · cabo · playa · acantilado', 'Entrada del mar · punta de tierra · costa llana · pared de roca junto al mar.'],
    ['Río · afluente · caudal', 'Corriente de agua · río que desemboca en otro río · cantidad de agua.'],
  ] },
];
