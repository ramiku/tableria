/**
 * Catálogo de eventos históricos de Cronolito — más de 300 hitos desde la fundación mítica de
 * Roma (-753) hasta la actualidad, generados a partir de la lista curada por el usuario.
 * `titulo` es lo único que se muestra ANTES de colocar la carta (nunca contiene el año); la
 * "descripcion divertida" es una plantilla de broma rotada de forma determinista por `id`
 * (ver el script de generación) — mantiene el tono de la historia sin repetir chiste dos veces
 * seguidas entre 15 variantes.
 */
import type { CronolitoEvent } from './types.js';

export const CRONOLITO_EVENTS: CronolitoEvent[] = [
  {
    "id": 1,
    "titulo": "Fundación mítica de Roma por Rómulo y Remo",
    "anio": -753,
    "descripcion": "Nota del becario al margen: \"Fundación mítica de Roma por Rómulo y Remo\". (Sigo sin encontrar el cable de la aspiradora, por cierto)."
  },
  {
    "id": 2,
    "titulo": "El rey Nabucodonosor II destruye Jerusalén y el Primer Templo",
    "anio": -586,
    "descripcion": "Escaneo temporal completado: \"El rey Nabucodonosor II destruye Jerusalén y el Primer Templo\". Ningún dinosaurio fue visto grabando esto para TikTok. De momento."
  },
  {
    "id": 3,
    "titulo": "Expulsión de Tarquinio el Soberbio y fundación de la República Romana",
    "anio": -509,
    "descripcion": "Fragmento recuperado del Cronolito: \"Expulsión de Tarquinio el Soberbio y fundación de la República Romana\". Coeficiente de paradoja: bajo. Se puede archivar sin pánico."
  },
  {
    "id": 4,
    "titulo": "Los griegos derrotan al Imperio Persa en la Batalla de Maratón",
    "anio": -490,
    "descripcion": "El sensor de coherencia temporal susurra: \"Los griegos derrotan al Imperio Persa en la Batalla de Maratón\". Nada de esto debería sorprenderte, viajero."
  },
  {
    "id": 5,
    "titulo": "Batalla de las Termópilas entre espartanos y persas",
    "anio": -480,
    "descripcion": "Bitácora de los Arquitectos del Tiempo: \"Batalla de las Termópilas entre espartanos y persas\". Otro ladrillo más en el muro de la Historia (con mayúscula)."
  },
  {
    "id": 6,
    "titulo": "Inicio de la Guerra del Peloponeso entre Atenas y Esparta",
    "anio": -431,
    "descripcion": "Aviso desde el centro de control: \"Inicio de la Guerra del Peloponeso entre Atenas y Esparta\". Se ruega no tocar nada más, ya tuvimos suficiente con la aspiradora."
  },
  {
    "id": 7,
    "titulo": "Alejandro Magno cruza el Helesponto e inicia la conquista de Persia",
    "anio": -334,
    "descripcion": "Eco cronológico detectado: \"Alejandro Magno cruza el Helesponto e inicia la conquista de Persia\". Verificado por triplicado — el tejido espacio-tiempo lo agradece."
  },
  {
    "id": 8,
    "titulo": "Fallecimiento de Alejandro Magno en Babilonia",
    "anio": -323,
    "descripcion": "El Cronolito parpadea y muestra: \"Fallecimiento de Alejandro Magno en Babilonia\". Colócalo bien o la humanidad se queda sin wifi para siempre."
  },
  {
    "id": 9,
    "titulo": "Aníbal Barca cruza los Alpes con sus elefantes para invadir Italia",
    "anio": -218,
    "descripcion": "Informe de campo: \"Aníbal Barca cruza los Alpes con sus elefantes para invadir Italia\". Ni una paradoja a la vista. Por ahora."
  },
  {
    "id": 10,
    "titulo": "Destrucción total de Cartago por las legiones romanas de Escipión",
    "anio": -146,
    "descripcion": "Susurro del pasado captado por los sensores: \"Destrucción total de Cartago por las legiones romanas de Escipión\". Archívalo antes de que el café se enfríe."
  },
  {
    "id": 11,
    "titulo": "Asesinato de Julio César en los idus de marzo",
    "anio": -44,
    "descripcion": "El oráculo temporal certifica: \"Asesinato de Julio César en los idus de marzo\". Esto sí que pasó, no como lo del becario y la aspiradora."
  },
  {
    "id": 12,
    "titulo": "César Augusto es nombrado emperador, naciendo el Imperio Romano",
    "anio": -27,
    "descripcion": "Pieza recuperada del suelo de la sala del Cronolito: \"César Augusto es nombrado emperador, naciendo el Imperio Romano\". Un poco de polvo, pero intacta."
  },
  {
    "id": 13,
    "titulo": "Fecha estimada del nacimiento de Jesús de Nazaret",
    "anio": 4,
    "descripcion": "Consulta al archivo maestro: \"Fecha estimada del nacimiento de Jesús de Nazaret\". Coincide con los registros oficiales de la Orden."
  },
  {
    "id": 14,
    "titulo": "Gran incendio de Roma bajo el mandato del emperador Nerón",
    "anio": 64,
    "descripcion": "Alerta de baja prioridad: \"Gran incendio de Roma bajo el mandato del emperador Nerón\". Ni rastro de paradojas ni de becarios torpes en las cercanías."
  },
  {
    "id": 15,
    "titulo": "Erupción del monte Vesubio y destrucción de Pompeya y Herculano",
    "anio": 79,
    "descripcion": "Registro del Cronolito: \"Erupción del monte Vesubio y destrucción de Pompeya y Herculano\". Los Arquitectos confirman que, efectivamente, esto pasó ANTES de que existiera el wifi."
  },
  {
    "id": 16,
    "titulo": "Edicto de Milán que decreta la libertad de culto en el Imperio Romano",
    "anio": 313,
    "descripcion": "Nota del becario al margen: \"Edicto de Milán que decreta la libertad de culto en el Imperio Romano\". (Sigo sin encontrar el cable de la aspiradora, por cierto)."
  },
  {
    "id": 17,
    "titulo": "Celebración del Primer Concilio de Nicea",
    "anio": 325,
    "descripcion": "Escaneo temporal completado: \"Celebración del Primer Concilio de Nicea\". Ningún dinosaurio fue visto grabando esto para TikTok. De momento."
  },
  {
    "id": 18,
    "titulo": "Constantino el Grande inaugura Constantinopla como nueva capital",
    "anio": 330,
    "descripcion": "Fragmento recuperado del Cronolito: \"Constantino el Grande inaugura Constantinopla como nueva capital\". Coeficiente de paradoja: bajo. Se puede archivar sin pánico."
  },
  {
    "id": 19,
    "titulo": "Saqueo de Roma por los visigodos liderados por Alarico I",
    "anio": 410,
    "descripcion": "El sensor de coherencia temporal susurra: \"Saqueo de Roma por los visigodos liderados por Alarico I\". Nada de esto debería sorprenderte, viajero."
  },
  {
    "id": 20,
    "titulo": "Batalla de los Campos Cataláunicos contra Atila el Huno",
    "anio": 451,
    "descripcion": "Bitácora de los Arquitectos del Tiempo: \"Batalla de los Campos Cataláunicos contra Atila el Huno\". Otro ladrillo más en el muro de la Historia (con mayúscula)."
  },
  {
    "id": 21,
    "titulo": "Caída del Imperio Romano de Occidente tras la deposición de Rómulo Augústulo",
    "anio": 476,
    "descripcion": "Aviso desde el centro de control: \"Caída del Imperio Romano de Occidente tras la deposición de Rómulo Augústulo\". Se ruega no tocar nada más, ya tuvimos suficiente con la aspiradora."
  },
  {
    "id": 22,
    "titulo": "Clausura de la Academia de Atenas por el emperador Justiniano I",
    "anio": 529,
    "descripcion": "Eco cronológico detectado: \"Clausura de la Academia de Atenas por el emperador Justiniano I\". Verificado por triplicado — el tejido espacio-tiempo lo agradece."
  },
  {
    "id": 23,
    "titulo": "Inauguración de la iglesia de Santa Sofía en Constantinopla",
    "anio": 537,
    "descripcion": "El Cronolito parpadea y muestra: \"Inauguración de la iglesia de Santa Sofía en Constantinopla\". Colócalo bien o la humanidad se queda sin wifi para siempre."
  },
  {
    "id": 24,
    "titulo": "Mahoma huye de La Meca a Medina, evento conocido como la Hégira",
    "anio": 622,
    "descripcion": "Informe de campo: \"Mahoma huye de La Meca a Medina, evento conocido como la Hégira\". Ni una paradoja a la vista. Por ahora."
  },
  {
    "id": 25,
    "titulo": "Tarik desembarca en Gibraltar iniciando la conquista musulmana de la península ibérica",
    "anio": 711,
    "descripcion": "Susurro del pasado captado por los sensores: \"Tarik desembarca en Gibraltar iniciando la conquista musulmana de la península ibérica\". Archívalo antes de que el café se enfríe."
  },
  {
    "id": 26,
    "titulo": "Carlos Martel derrota a los musulmanes en la Batalla de Poitiers",
    "anio": 732,
    "descripcion": "El oráculo temporal certifica: \"Carlos Martel derrota a los musulmanes en la Batalla de Poitiers\". Esto sí que pasó, no como lo del becario y la aspiradora."
  },
  {
    "id": 27,
    "titulo": "Primer ataque vikingo registrado a las costas de Inglaterra en Lindisfarne",
    "anio": 793,
    "descripcion": "Pieza recuperada del suelo de la sala del Cronolito: \"Primer ataque vikingo registrado a las costas de Inglaterra en Lindisfarne\". Un poco de polvo, pero intacta."
  },
  {
    "id": 28,
    "titulo": "Coronación de Carlomagno como Emperador del Sacro Imperio Romano Germánico",
    "anio": 800,
    "descripcion": "Consulta al archivo maestro: \"Coronación de Carlomagno como Emperador del Sacro Imperio Romano Germánico\". Coincide con los registros oficiales de la Orden."
  },
  {
    "id": 29,
    "titulo": "Tratado de Verdún que divide el Imperio carolingio entre los nietos de Carlomagno",
    "anio": 843,
    "descripcion": "Alerta de baja prioridad: \"Tratado de Verdún que divide el Imperio carolingio entre los nietos de Carlomagno\". Ni rastro de paradojas ni de becarios torpes en las cercanías."
  },
  {
    "id": 30,
    "titulo": "Otoón I es coronado emperador, fundando el Sacro Imperio Romano Germánico",
    "anio": 962,
    "descripcion": "Registro del Cronolito: \"Otoón I es coronado emperador, fundando el Sacro Imperio Romano Germánico\". Los Arquitectos confirman que, efectivamente, esto pasó ANTES de que existiera el wifi."
  },
  {
    "id": 31,
    "titulo": "Batalla de Clontarf que debilita el poder de los vikingos en Irlanda",
    "anio": 1014,
    "descripcion": "Nota del becario al margen: \"Batalla de Clontarf que debilita el poder de los vikingos en Irlanda\". (Sigo sin encontrar el cable de la aspiradora, por cierto)."
  },
  {
    "id": 32,
    "titulo": "Cisma de Oriente que divide a la Iglesia católica y a la Iglesia ortodoxa",
    "anio": 1054,
    "descripcion": "Escaneo temporal completado: \"Cisma de Oriente que divide a la Iglesia católica y a la Iglesia ortodoxa\". Ningún dinosaurio fue visto grabando esto para TikTok. De momento."
  },
  {
    "id": 33,
    "titulo": "Guillermo el Conquistador invade Inglaterra tras ganar la Batalla de Hastings",
    "anio": 1066,
    "descripcion": "Fragmento recuperado del Cronolito: \"Guillermo el Conquistador invade Inglaterra tras ganar la Batalla de Hastings\". Coeficiente de paradoja: bajo. Se puede archivar sin pánico."
  },
  {
    "id": 34,
    "titulo": "Los cruzados toman Jerusalén durante la Primera Cruzada",
    "anio": 1099,
    "descripcion": "El sensor de coherencia temporal susurra: \"Los cruzados toman Jerusalén durante la Primera Cruzada\". Nada de esto debería sorprenderte, viajero."
  },
  {
    "id": 35,
    "titulo": "Concordato de Worms que pone fin a la Querella de las Investiduras",
    "anio": 1122,
    "descripcion": "Bitácora de los Arquitectos del Tiempo: \"Concordato de Worms que pone fin a la Querella de las Investiduras\". Otro ladrillo más en el muro de la Historia (con mayúscula)."
  },
  {
    "id": 36,
    "titulo": "Inicio de la Segunda Cruzada predicada por Bernardo de Claraval",
    "anio": 1147,
    "descripcion": "Aviso desde el centro de control: \"Inicio de la Segunda Cruzada predicada por Bernardo de Claraval\". Se ruega no tocar nada más, ya tuvimos suficiente con la aspiradora."
  },
  {
    "id": 37,
    "titulo": "Saladino recupera Jerusalén tras derrotar a los cruzados en los Cuernos de Hattin",
    "anio": 1187,
    "descripcion": "Eco cronológico detectado: \"Saladino recupera Jerusalén tras derrotar a los cruzados en los Cuernos de Hattin\". Verificado por triplicado — el tejido espacio-tiempo lo agradece."
  },
  {
    "id": 38,
    "titulo": "Saqueo de Constantinopla por los caballeros de la Cuarta Cruzada",
    "anio": 1204,
    "descripcion": "El Cronolito parpadea y muestra: \"Saqueo de Constantinopla por los caballeros de la Cuarta Cruzada\". Colócalo bien o la humanidad se queda sin wifi para siempre."
  },
  {
    "id": 39,
    "titulo": "Batalla de Las Navas de Tolosa, clave en la Reconquista ibérica",
    "anio": 1212,
    "descripcion": "Informe de campo: \"Batalla de Las Navas de Tolosa, clave en la Reconquista ibérica\". Ni una paradoja a la vista. Por ahora."
  },
  {
    "id": 40,
    "titulo": "El rey Juan I de Inglaterra firma la Carta Magna",
    "anio": 1215,
    "descripcion": "Susurro del pasado captado por los sensores: \"El rey Juan I de Inglaterra firma la Carta Magna\". Archívalo antes de que el café se enfríe."
  },
  {
    "id": 41,
    "titulo": "Fallecimiento de Gengis Kan, unificador del Imperio mongol",
    "anio": 1227,
    "descripcion": "El oráculo temporal certifica: \"Fallecimiento de Gengis Kan, unificador del Imperio mongol\". Esto sí que pasó, no como lo del becario y la aspiradora."
  },
  {
    "id": 42,
    "titulo": "Los mongoles saquean Bagdad y ejecutan al último califa abasí",
    "anio": 1258,
    "descripcion": "Pieza recuperada del suelo de la sala del Cronolito: \"Los mongoles saquean Bagdad y ejecutan al último califa abasí\". Un poco de polvo, pero intacta."
  },
  {
    "id": 43,
    "titulo": "Marco Polo parte de Venecia en su histórico viaje hacia Asia",
    "anio": 1271,
    "descripcion": "Consulta al archivo maestro: \"Marco Polo parte de Venecia en su histórico viaje hacia Asia\". Coincide con los registros oficiales de la Orden."
  },
  {
    "id": 44,
    "titulo": "Caída de Acre y fin de la presencia cruzada en Tierra Santa",
    "anio": 1291,
    "descripcion": "Alerta de baja prioridad: \"Caída de Acre y fin de la presencia cruzada en Tierra Santa\". Ni rastro de paradojas ni de becarios torpes en las cercanías."
  },
  {
    "id": 45,
    "titulo": "El papa Clemente V traslada la sede pontificia a Aviñón",
    "anio": 1309,
    "descripcion": "Registro del Cronolito: \"El papa Clemente V traslada la sede pontificia a Aviñón\". Los Arquitectos confirman que, efectivamente, esto pasó ANTES de que existiera el wifi."
  },
  {
    "id": 46,
    "titulo": "Ejecución de Jacques de Molay, último Gran Maestre de los Templarios",
    "anio": 1314,
    "descripcion": "Nota del becario al margen: \"Ejecución de Jacques de Molay, último Gran Maestre de los Templarios\". (Sigo sin encontrar el cable de la aspiradora, por cierto)."
  },
  {
    "id": 47,
    "titulo": "Inicio de la Guerra de los Cien Años entre Francia e Inglaterra",
    "anio": 1337,
    "descripcion": "Escaneo temporal completado: \"Inicio de la Guerra de los Cien Años entre Francia e Inglaterra\". Ningún dinosaurio fue visto grabando esto para TikTok. De momento."
  },
  {
    "id": 48,
    "titulo": "Batalla de Crécy, primer gran uso militar del arco largo inglés",
    "anio": 1346,
    "descripcion": "Fragmento recuperado del Cronolito: \"Batalla de Crécy, primer gran uso militar del arco largo inglés\". Coeficiente de paradoja: bajo. Se puede archivar sin pánico."
  },
  {
    "id": 49,
    "titulo": "Llegada de la Peste Negra a los puertos de Europa",
    "anio": 1347,
    "descripcion": "El sensor de coherencia temporal susurra: \"Llegada de la Peste Negra a los puertos de Europa\". Nada de esto debería sorprenderte, viajero."
  },
  {
    "id": 50,
    "titulo": "Promulgación de la Bula de Oro por el emperador Carlos IV de Luxemburgo",
    "anio": 1356,
    "descripcion": "Bitácora de los Arquitectos del Tiempo: \"Promulgación de la Bula de Oro por el emperador Carlos IV de Luxemburgo\". Otro ladrillo más en el muro de la Historia (con mayúscula)."
  },
  {
    "id": 51,
    "titulo": "Robin Hood apareció por primera vez en la literatura y cultura popular",
    "anio": 1377,
    "descripcion": "Aviso desde el centro de control: \"Robin Hood apareció por primera vez en la literatura y cultura popular\". Se ruega no tocar nada más, ya tuvimos suficiente con la aspiradora."
  },
  {
    "id": 52,
    "titulo": "Comienzo del Cisma de Occidente con dos papas simultáneos",
    "anio": 1378,
    "descripcion": "Eco cronológico detectado: \"Comienzo del Cisma de Occidente con dos papas simultáneos\". Verificado por triplicado — el tejido espacio-tiempo lo agradece."
  },
  {
    "id": 53,
    "titulo": "Batalla de Aljubarrota que consolida la independencia de Portugal frente a Castilla",
    "anio": 1385,
    "descripcion": "El Cronolito parpadea y muestra: \"Batalla de Aljubarrota que consolida la independencia de Portugal frente a Castilla\". Colócalo bien o la humanidad se queda sin wifi para siempre."
  },
  {
    "id": 54,
    "titulo": "Batalla de Kosovo entre el Imperio Otomano y una coalición serba",
    "anio": 1389,
    "descripcion": "Informe de campo: \"Batalla de Kosovo entre el Imperio Otomano y una coalición serba\". Ni una paradoja a la vista. Por ahora."
  },
  {
    "id": 55,
    "titulo": "Batalla de Azincourt y quema en la hoguera de Jan Hus en Constanza",
    "anio": 1415,
    "descripcion": "Susurro del pasado captado por los sensores: \"Batalla de Azincourt y quema en la hoguera de Jan Hus en Constanza\". Archívalo antes de que el café se enfríe."
  },
  {
    "id": 56,
    "titulo": "Juana de Arco levanta el sitio de Orleans durante la Guerra de los Cien Años",
    "anio": 1429,
    "descripcion": "El oráculo temporal certifica: \"Juana de Arco levanta el sitio de Orleans durante la Guerra de los Cien Años\". Esto sí que pasó, no como lo del becario y la aspiradora."
  },
  {
    "id": 57,
    "titulo": "Johannes Gutenberg inventa los tipos móviles de la imprenta moderna",
    "anio": 1440,
    "descripcion": "Pieza recuperada del suelo de la sala del Cronolito: \"Johannes Gutenberg inventa los tipos móviles de la imprenta moderna\". Un poco de polvo, pero intacta."
  },
  {
    "id": 58,
    "titulo": "Caída de Constantinopla ante los otomanos y fin del Imperio Bizantino",
    "anio": 1453,
    "descripcion": "Consulta al archivo maestro: \"Caída de Constantinopla ante los otomanos y fin del Imperio Bizantino\". Coincide con los registros oficiales de la Orden."
  },
  {
    "id": 59,
    "titulo": "Matrimonio de Isabel de Castilla y Fernando de Aragón, los Reyes Católicos",
    "anio": 1469,
    "descripcion": "Alerta de baja prioridad: \"Matrimonio de Isabel de Castilla y Fernando de Aragón, los Reyes Católicos\". Ni rastro de paradojas ni de becarios torpes en las cercanías."
  },
  {
    "id": 60,
    "titulo": "Establecimiento de la Inquisición española mediante bula papal",
    "anio": 1478,
    "descripcion": "Registro del Cronolito: \"Establecimiento de la Inquisición española mediante bula papal\". Los Arquitectos confirman que, efectivamente, esto pasó ANTES de que existiera el wifi."
  },
  {
    "id": 61,
    "titulo": "Batalla de Bosworth y ascenso de la dinastía Tudor al trono inglés",
    "anio": 1485,
    "descripcion": "Nota del becario al margen: \"Batalla de Bosworth y ascenso de la dinastía Tudor al trono inglés\". (Sigo sin encontrar el cable de la aspiradora, por cierto)."
  },
  {
    "id": 62,
    "titulo": "Bartolomé Díaz dobla el Cabo de Buena Esperanza",
    "anio": 1488,
    "descripcion": "Escaneo temporal completado: \"Bartolomé Díaz dobla el Cabo de Buena Esperanza\". Ningún dinosaurio fue visto grabando esto para TikTok. De momento."
  },
  {
    "id": 63,
    "titulo": "Descubrimiento de América por Cristóbal Colón y toma de Granada",
    "anio": 1492,
    "descripcion": "Fragmento recuperado del Cronolito: \"Descubrimiento de América por Cristóbal Colón y toma de Granada\". Coeficiente de paradoja: bajo. Se puede archivar sin pánico."
  },
  {
    "id": 64,
    "titulo": "Firma del Tratado de Tordesillas entre España y Portugal",
    "anio": 1494,
    "descripcion": "El sensor de coherencia temporal susurra: \"Firma del Tratado de Tordesillas entre España y Portugal\". Nada de esto debería sorprenderte, viajero."
  },
  {
    "id": 65,
    "titulo": "Vasco da Gama zarpa de Lisboa rumbo a la India bordeando África",
    "anio": 1497,
    "descripcion": "Bitácora de los Arquitectos del Tiempo: \"Vasco da Gama zarpa de Lisboa rumbo a la India bordeando África\". Otro ladrillo más en el muro de la Historia (con mayúscula)."
  },
  {
    "id": 66,
    "titulo": "Tercer viaje de Cristóbal Colón en el que llega al continente americano",
    "anio": 1498,
    "descripcion": "Aviso desde el centro de control: \"Tercer viaje de Cristóbal Colón en el que llega al continente americano\". Se ruega no tocar nada más, ya tuvimos suficiente con la aspiradora."
  },
  {
    "id": 67,
    "titulo": "Publicación de la primera edición conocida de La Celestina",
    "anio": 1499,
    "descripcion": "Eco cronológico detectado: \"Publicación de la primera edición conocida de La Celestina\". Verificado por triplicado — el tejido espacio-tiempo lo agradece."
  },
  {
    "id": 68,
    "titulo": "Pedro Álvares Cabral llega a las costas de Brasil",
    "anio": 1500,
    "descripcion": "El Cronolito parpadea y muestra: \"Pedro Álvares Cabral llega a las costas de Brasil\". Colócalo bien o la humanidad se queda sin wifi para siempre."
  },
  {
    "id": 69,
    "titulo": "Inicio de la exportación formal de esclavos africanos hacia América",
    "anio": 1501,
    "descripcion": "Informe de campo: \"Inicio de la exportación formal de esclavos africanos hacia América\". Ni una paradoja a la vista. Por ahora."
  },
  {
    "id": 70,
    "titulo": "Se funda la Casa de la Contratación en Sevilla para regular el comercio americano",
    "anio": 1502,
    "descripcion": "Susurro del pasado captado por los sensores: \"Se funda la Casa de la Contratación en Sevilla para regular el comercio americano\". Archívalo antes de que el café se enfríe."
  },
  {
    "id": 71,
    "titulo": "Leonardo da Vinci comienza a pintar el retrato de la Mona Lisa",
    "anio": 1503,
    "descripcion": "El oráculo temporal certifica: \"Leonardo da Vinci comienza a pintar el retrato de la Mona Lisa\". Esto sí que pasó, no como lo del becario y la aspiradora."
  },
  {
    "id": 72,
    "titulo": "Fallecimiento de la reina Isabel I de Castilla en Medina del Campo",
    "anio": 1504,
    "descripcion": "Pieza recuperada del suelo de la sala del Cronolito: \"Fallecimiento de la reina Isabel I de Castilla en Medina del Campo\". Un poco de polvo, pero intacta."
  },
  {
    "id": 73,
    "titulo": "Tratado de Blois entre Fernando el Católico y Luis XII de Francia",
    "anio": 1505,
    "descripcion": "Consulta al archivo maestro: \"Tratado de Blois entre Fernando el Católico y Luis XII de Francia\". Coincide con los registros oficiales de la Orden."
  },
  {
    "id": 74,
    "titulo": "Inicio de la construcción de la actual Basílica de San Pedro en Roma",
    "anio": 1506,
    "descripcion": "Alerta de baja prioridad: \"Inicio de la construcción de la actual Basílica de San Pedro en Roma\". Ni rastro de paradojas ni de becarios torpes en las cercanías."
  },
  {
    "id": 75,
    "titulo": "El cartógrafo Martin Waldseemüller utiliza por primera vez el nombre de América",
    "anio": 1507,
    "descripcion": "Registro del Cronolito: \"El cartógrafo Martin Waldseemüller utiliza por primera vez el nombre de América\". Los Arquitectos confirman que, efectivamente, esto pasó ANTES de que existiera el wifi."
  },
  {
    "id": 76,
    "titulo": "Miguel Ángel comienza los frescos de la bóveda de la Capilla Sixtina",
    "anio": 1508,
    "descripcion": "Nota del becario al margen: \"Miguel Ángel comienza los frescos de la bóveda de la Capilla Sixtina\". (Sigo sin encontrar el cable de la aspiradora, por cierto)."
  },
  {
    "id": 77,
    "titulo": "Coronación de Enrique VIII como rey de Inglaterra",
    "anio": 1509,
    "descripcion": "Escaneo temporal completado: \"Coronación de Enrique VIII como rey de Inglaterra\". Ningún dinosaurio fue visto grabando esto para TikTok. De momento."
  },
  {
    "id": 78,
    "titulo": "Alfonso de Albuquerque conquista Goa para el Imperio Portugués",
    "anio": 1510,
    "descripcion": "Fragmento recuperado del Cronolito: \"Alfonso de Albuquerque conquista Goa para el Imperio Portugués\". Coeficiente de paradoja: bajo. Se puede archivar sin pánico."
  },
  {
    "id": 79,
    "titulo": "Diego Velázquez de Cuéllar inicia la conquista de la isla de Cuba",
    "anio": 1511,
    "descripcion": "El sensor de coherencia temporal susurra: \"Diego Velázquez de Cuéllar inicia la conquista de la isla de Cuba\". Nada de esto debería sorprenderte, viajero."
  },
  {
    "id": 80,
    "titulo": "Promulgación de las Leyes de Burgos para regular el trato a los indígenas",
    "anio": 1512,
    "descripcion": "Bitácora de los Arquitectos del Tiempo: \"Promulgación de las Leyes de Burgos para regular el trato a los indígenas\". Otro ladrillo más en el muro de la Historia (con mayúscula)."
  },
  {
    "id": 81,
    "titulo": "Vasco Núñez de Balboa divisa el Océano Pacífico, bautizado como Mar del Sur",
    "anio": 1513,
    "descripcion": "Aviso desde el centro de control: \"Vasco Núñez de Balboa divisa el Océano Pacífico, bautizado como Mar del Sur\". Se ruega no tocar nada más, ya tuvimos suficiente con la aspiradora."
  },
  {
    "id": 82,
    "titulo": "Batalla de Chaldiran entre el Imperio Otomano y el Imperio Safávida",
    "anio": 1514,
    "descripcion": "Eco cronológico detectado: \"Batalla de Chaldiran entre el Imperio Otomano y el Imperio Safávida\". Verificado por triplicado — el tejido espacio-tiempo lo agradece."
  },
  {
    "id": 83,
    "titulo": "Francia gana la Batalla de Marignano bajo el mando de Francisco I",
    "anio": 1515,
    "descripcion": "El Cronolito parpadea y muestra: \"Francia gana la Batalla de Marignano bajo el mando de Francisco I\". Colócalo bien o la humanidad se queda sin wifi para siempre."
  },
  {
    "id": 84,
    "titulo": "Publicación de la obra Utopía de Tomás Moro",
    "anio": 1516,
    "descripcion": "Informe de campo: \"Publicación de la obra Utopía de Tomás Moro\". Ni una paradoja a la vista. Por ahora."
  },
  {
    "id": 85,
    "titulo": "Martín Lutero clava sus 95 tesis en la iglesia de Wittenberg iniciando la Reforma",
    "anio": 1517,
    "descripcion": "Susurro del pasado captado por los sensores: \"Martín Lutero clava sus 95 tesis en la iglesia de Wittenberg iniciando la Reforma\". Archívalo antes de que el café se enfríe."
  },
  {
    "id": 86,
    "titulo": "Carlos I de España otorga las primeras licencias para el comercio de esclavos",
    "anio": 1518,
    "descripcion": "El oráculo temporal certifica: \"Carlos I de España otorga las primeras licencias para el comercio de esclavos\". Esto sí que pasó, no como lo del becario y la aspiradora."
  },
  {
    "id": 87,
    "titulo": "Hernán Cortés desembarca en México y comienza la invasión del Imperio Azteca",
    "anio": 1519,
    "descripcion": "Pieza recuperada del suelo de la sala del Cronolito: \"Hernán Cortés desembarca en México y comienza la invasión del Imperio Azteca\". Un poco de polvo, pero intacta."
  },
  {
    "id": 88,
    "titulo": "Carlos V es coronado Emperador del Sacro Imperio Romano Germánico en Aquisgrán",
    "anio": 1520,
    "descripcion": "Consulta al archivo maestro: \"Carlos V es coronado Emperador del Sacro Imperio Romano Germánico en Aquisgrán\". Coincide con los registros oficiales de la Orden."
  },
  {
    "id": 89,
    "titulo": "Caída de Tenochtitlan ante las tropas españolas e indígenas aliadas",
    "anio": 1521,
    "descripcion": "Alerta de baja prioridad: \"Caída de Tenochtitlan ante las tropas españolas e indígenas aliadas\". Ni rastro de paradojas ni de becarios torpes en las cercanías."
  },
  {
    "id": 90,
    "titulo": "Juan Sebastián Elcano completa la primera circunnavegación de la Tierra",
    "anio": 1522,
    "descripcion": "Registro del Cronolito: \"Juan Sebastián Elcano completa la primera circunnavegación de la Tierra\". Los Arquitectos confirman que, efectivamente, esto pasó ANTES de que existiera el wifi."
  },
  {
    "id": 91,
    "titulo": "Disolución de la Unión de Kalmar y ascenso de Gustavo Vasa al trono sueco",
    "anio": 1523,
    "descripcion": "Nota del becario al margen: \"Disolución de la Unión de Kalmar y ascenso de Gustavo Vasa al trono sueco\". (Sigo sin encontrar el cable de la aspiradora, por cierto)."
  },
  {
    "id": 92,
    "titulo": "Inicio de la Guerra de los Campesinos alemanes inspirada en principios reformistas",
    "anio": 1524,
    "descripcion": "Escaneo temporal completado: \"Inicio de la Guerra de los Campesinos alemanes inspirada en principios reformistas\". Ningún dinosaurio fue visto grabando esto para TikTok. De momento."
  },
  {
    "id": 93,
    "titulo": "Batalla de Pavía en la que el rey Francisco I de Francia es capturado por Carlos V",
    "anio": 1525,
    "descripcion": "Fragmento recuperado del Cronolito: \"Batalla de Pavía en la que el rey Francisco I de Francia es capturado por Carlos V\". Coeficiente de paradoja: bajo. Se puede archivar sin pánico."
  },
  {
    "id": 94,
    "titulo": "Batalla de Mohács y muerte del rey Luis II de Hungría ante los otomanos",
    "anio": 1526,
    "descripcion": "El sensor de coherencia temporal susurra: \"Batalla de Mohács y muerte del rey Luis II de Hungría ante los otomanos\". Nada de esto debería sorprenderte, viajero."
  },
  {
    "id": 95,
    "titulo": "Saqueo de Roma por las tropas imperiales de Carlos V",
    "anio": 1527,
    "descripcion": "Bitácora de los Arquitectos del Tiempo: \"Saqueo de Roma por las tropas imperiales de Carlos V\". Otro ladrillo más en el muro de la Historia (con mayúscula)."
  },
  {
    "id": 96,
    "titulo": "Publicación de El Cortesano de Baldassare Castiglione",
    "anio": 1528,
    "descripcion": "Aviso desde el centro de control: \"Publicación de El Cortesano de Baldassare Castiglione\". Se ruega no tocar nada más, ya tuvimos suficiente con la aspiradora."
  },
  {
    "id": 97,
    "titulo": "Primer Sitio de Viena por parte de las tropas otomanas de Solimán el Magnífico",
    "anio": 1529,
    "descripcion": "Eco cronológico detectado: \"Primer Sitio de Viena por parte de las tropas otomanas de Solimán el Magnífico\". Verificado por triplicado — el tejido espacio-tiempo lo agradece."
  },
  {
    "id": 98,
    "titulo": "Presentación de la Confesión de Augsburgo ante el emperador Carlos V",
    "anio": 1530,
    "descripcion": "El Cronolito parpadea y muestra: \"Presentación de la Confesión de Augsburgo ante el emperador Carlos V\". Colócalo bien o la humanidad se queda sin wifi para siempre."
  },
  {
    "id": 99,
    "titulo": "Aparición de la Virgen de Guadalupe en el cerro del Tepeyac, México",
    "anio": 1531,
    "descripcion": "Informe de campo: \"Aparición de la Virgen de Guadalupe en el cerro del Tepeyac, México\". Ni una paradoja a la vista. Por ahora."
  },
  {
    "id": 100,
    "titulo": "Francisco Pizarro captura al inca Atahualpa en la batalla de Cajamarca",
    "anio": 1532,
    "descripcion": "Susurro del pasado captado por los sensores: \"Francisco Pizarro captura al inca Atahualpa en la batalla de Cajamarca\". Archívalo antes de que el café se enfríe."
  },
  {
    "id": 101,
    "titulo": "Ejecución de Atahualpa e ingreso de los españoles en el Cuzco",
    "anio": 1533,
    "descripcion": "El oráculo temporal certifica: \"Ejecución de Atahualpa e ingreso de los españoles en el Cuzco\". Esto sí que pasó, no como lo del becario y la aspiradora."
  },
  {
    "id": 102,
    "titulo": "Enrique VIII promulga el Acta de Supremacía declarándose jefe de la Iglesia inglesa",
    "anio": 1534,
    "descripcion": "Pieza recuperada del suelo de la sala del Cronolito: \"Enrique VIII promulga el Acta de Supremacía declarándose jefe de la Iglesia inglesa\". Un poco de polvo, pero intacta."
  },
  {
    "id": 103,
    "titulo": "Fundación de la Ciudad de los Reyes, actual Lima, por Francisco Pizarro",
    "anio": 1535,
    "descripcion": "Consulta al archivo maestro: \"Fundación de la Ciudad de los Reyes, actual Lima, por Francisco Pizarro\". Coincide con los registros oficiales de la Orden."
  },
  {
    "id": 104,
    "titulo": "Ejecución de Ana Bolena, segunda esposa de Enrique VIII de Inglaterra",
    "anio": 1536,
    "descripcion": "Alerta de baja prioridad: \"Ejecución de Ana Bolena, segunda esposa de Enrique VIII de Inglaterra\". Ni rastro de paradojas ni de becarios torpes en las cercanías."
  },
  {
    "id": 105,
    "titulo": "Fundación de la ciudad de Asunción por Juan de Salazar y Espinosa",
    "anio": 1537,
    "descripcion": "Registro del Cronolito: \"Fundación de la ciudad de Asunción por Juan de Salazar y Espinosa\". Los Arquitectos confirman que, efectivamente, esto pasó ANTES de que existiera el wifi."
  },
  {
    "id": 106,
    "titulo": "Fundación de la Universidad de Santo Domingo, primera de América",
    "anio": 1538,
    "descripcion": "Nota del becario al margen: \"Fundación de la Universidad de Santo Domingo, primera de América\". (Sigo sin encontrar el cable de la aspiradora, por cierto)."
  },
  {
    "id": 107,
    "titulo": "Hernando de Soto desembarca en Florida iniciando su expedición exploratoria",
    "anio": 1539,
    "descripcion": "Escaneo temporal completado: \"Hernando de Soto desembarca en Florida iniciando su expedición exploratoria\". Ningún dinosaurio fue visto grabando esto para TikTok. De momento."
  },
  {
    "id": 108,
    "titulo": "Fundación de la Compañía de Jesús por Ignacio de Loyola mediante bula papal",
    "anio": 1540,
    "descripcion": "Fragmento recuperado del Cronolito: \"Fundación de la Compañía de Jesús por Ignacio de Loyola mediante bula papal\". Coeficiente de paradoja: bajo. Se puede archivar sin pánico."
  },
  {
    "id": 109,
    "titulo": "Fundación de Santiago de Chile por el conquistador Pedro de Valdivia",
    "anio": 1541,
    "descripcion": "El sensor de coherencia temporal susurra: \"Fundación de Santiago de Chile por el conquistador Pedro de Valdivia\". Nada de esto debería sorprenderte, viajero."
  },
  {
    "id": 110,
    "titulo": "Promulgación de las Leyes Nuevas que buscaban abolir las encomiendas americanas",
    "anio": 1542,
    "descripcion": "Bitácora de los Arquitectos del Tiempo: \"Promulgación de las Leyes Nuevas que buscaban abolir las encomiendas americanas\". Otro ladrillo más en el muro de la Historia (con mayúscula)."
  },
  {
    "id": 111,
    "titulo": "Nicolás Copérnico publica su teoría heliocéntrica sobre las órbitas planetarias",
    "anio": 1543,
    "descripcion": "Aviso desde el centro de control: \"Nicolás Copérnico publica su teoría heliocéntrica sobre las órbitas planetarias\". Se ruega no tocar nada más, ya tuvimos suficiente con la aspiradora."
  },
  {
    "id": 112,
    "titulo": "Fundación del Virreinato del Perú por orden del rey Carlos I",
    "anio": 1544,
    "descripcion": "Eco cronológico detectado: \"Fundación del Virreinato del Perú por orden del rey Carlos I\". Verificado por triplicado — el tejido espacio-tiempo lo agradece."
  },
  {
    "id": 113,
    "titulo": "Apertura oficial del Concilio de Trento para iniciar la Contrarreforma católica",
    "anio": 1545,
    "descripcion": "El Cronolito parpadea y muestra: \"Apertura oficial del Concilio de Trento para iniciar la Contrarreforma católica\". Colócalo bien o la humanidad se queda sin wifi para siempre."
  },
  {
    "id": 114,
    "titulo": "Muerte de Martín Lutero y descubrimiento de las minas de plata de Potosí",
    "anio": 1546,
    "descripcion": "Informe de campo: \"Muerte de Martín Lutero y descubrimiento de las minas de plata de Potosí\". Ni una paradoja a la vista. Por ahora."
  },
  {
    "id": 115,
    "titulo": "Iván el Terrible es coronado como el primer Zar de toda Rusia",
    "anio": 1547,
    "descripcion": "Susurro del pasado captado por los sensores: \"Iván el Terrible es coronado como el primer Zar de toda Rusia\". Archívalo antes de que el café se enfríe."
  },
  {
    "id": 116,
    "titulo": "Batalla de Jaquijahuana que pone fin a la rebelión de Gonzalo Pizarro en Perú",
    "anio": 1548,
    "descripcion": "El oráculo temporal certifica: \"Batalla de Jaquijahuana que pone fin a la rebelión de Gonzalo Pizarro en Perú\". Esto sí que pasó, no como lo del becario y la aspiradora."
  },
  {
    "id": 117,
    "titulo": "Llegada de los primeros misioneros jesuitas a la costa de Brasil",
    "anio": 1549,
    "descripcion": "Pieza recuperada del suelo de la sala del Cronolito: \"Llegada de los primeros misioneros jesuitas a la costa de Brasil\". Un poco de polvo, pero intacta."
  },
  {
    "id": 118,
    "titulo": "Inicio de la Junta de Valladolid sobre los derechos de los indígenas americanos",
    "anio": 1550,
    "descripcion": "Consulta al archivo maestro: \"Inicio de la Junta de Valladolid sobre los derechos de los indígenas americanos\". Coincide con los registros oficiales de la Orden."
  },
  {
    "id": 119,
    "titulo": "Fundación de la Real y Pontificia Universidad de México",
    "anio": 1551,
    "descripcion": "Alerta de baja prioridad: \"Fundación de la Real y Pontificia Universidad de México\". Ni rastro de paradojas ni de becarios torpes en las cercanías."
  },
  {
    "id": 120,
    "titulo": "Bartolomé de las Casas publica la Brevísima relación de la destrucción de las Indias",
    "anio": 1552,
    "descripcion": "Registro del Cronolito: \"Bartolomé de las Casas publica la Brevísima relación de la destrucción de las Indias\". Los Arquitectos confirman que, efectivamente, esto pasó ANTES de que existiera el wifi."
  },
  {
    "id": 121,
    "titulo": "Coronación de María I de Inglaterra, conocida como María la Sanguinaria",
    "anio": 1553,
    "descripcion": "Nota del becario al margen: \"Coronación de María I de Inglaterra, conocida como María la Sanguinaria\". (Sigo sin encontrar el cable de la aspiradora, por cierto)."
  },
  {
    "id": 122,
    "titulo": "Publicación anónima de la novela picaresca El Lazarillo de Tormes",
    "anio": 1554,
    "descripcion": "Escaneo temporal completado: \"Publicación anónima de la novela picaresca El Lazarillo de Tormes\". Ningún dinosaurio fue visto grabando esto para TikTok. De momento."
  },
  {
    "id": 123,
    "titulo": "Firma de la Paz de Augsburgo que consagra la división religiosa de Alemania",
    "anio": 1555,
    "descripcion": "Fragmento recuperado del Cronolito: \"Firma de la Paz de Augsburgo que consagra la división religiosa de Alemania\". Coeficiente de paradoja: bajo. Se puede archivar sin pánico."
  },
  {
    "id": 124,
    "titulo": "Abdicación de Carlos V y ascenso de Felipe II al trono de España",
    "anio": 1556,
    "descripcion": "El sensor de coherencia temporal susurra: \"Abdicación de Carlos V y ascenso de Felipe II al trono de España\". Nada de esto debería sorprenderte, viajero."
  },
  {
    "id": 125,
    "titulo": "Batalla de San Quintín donde las tropas españolas derrotan al ejército francés",
    "anio": 1557,
    "descripcion": "Bitácora de los Arquitectos del Tiempo: \"Batalla de San Quintín donde las tropas españolas derrotan al ejército francés\". Otro ladrillo más en el muro de la Historia (con mayúscula)."
  },
  {
    "id": 126,
    "titulo": "Felipe II prohíbe la importación de libros extranjeros a España",
    "anio": 1558,
    "descripcion": "Aviso desde el centro de control: \"Felipe II prohíbe la importación de libros extranjeros a España\". Se ruega no tocar nada más, ya tuvimos suficiente con la aspiradora."
  },
  {
    "id": 127,
    "titulo": "Tratado de Cateau-Cambrésis que pone fin a las Guerras de Italia",
    "anio": 1559,
    "descripcion": "Eco cronológico detectado: \"Tratado de Cateau-Cambrésis que pone fin a las Guerras de Italia\". Verificado por triplicado — el tejido espacio-tiempo lo agradece."
  },
  {
    "id": 128,
    "titulo": "Proclamación de la Reforma protestante en Escocia por obra de John Knox",
    "anio": 1560,
    "descripcion": "El Cronolito parpadea y muestra: \"Proclamación de la Reforma protestante en Escocia por obra de John Knox\". Colócalo bien o la humanidad se queda sin wifi para siempre."
  },
  {
    "id": 129,
    "titulo": "Felipe II traslada la corte española de Toledo a Madrid de forma permanente",
    "anio": 1561,
    "descripcion": "Informe de campo: \"Felipe II traslada la corte española de Toledo a Madrid de forma permanente\". Ni una paradoja a la vista. Por ahora."
  },
  {
    "id": 130,
    "titulo": "Matanza de Wassy que da inicio formal a las Guerras de Religión de Francia",
    "anio": 1562,
    "descripcion": "Susurro del pasado captado por los sensores: \"Matanza de Wassy que da inicio formal a las Guerras de Religión de Francia\". Archívalo antes de que el café se enfríe."
  },
  {
    "id": 131,
    "titulo": "Inicio de la construcción del Monasterio de El Escorial por orden de Felipe II",
    "anio": 1563,
    "descripcion": "El oráculo temporal certifica: \"Inicio de la construcción del Monasterio de El Escorial por orden de Felipe II\". Esto sí que pasó, no como lo del becario y la aspiradora."
  },
  {
    "id": 132,
    "titulo": "Fallecimiento del pintor y escultor renacentista Miguel Ángel Buonarroti",
    "anio": 1564,
    "descripcion": "Pieza recuperada del suelo de la sala del Cronolito: \"Fallecimiento del pintor y escultor renacentista Miguel Ángel Buonarroti\". Un poco de polvo, pero intacta."
  },
  {
    "id": 133,
    "titulo": "Fundación de San Agustín en Florida, el asentamiento europeo más antiguo de EE.UU.",
    "anio": 1565,
    "descripcion": "Consulta al archivo maestro: \"Fundación de San Agustín en Florida, el asentamiento europeo más antiguo de EE.UU.\". Coincide con los registros oficiales de la Orden."
  },
  {
    "id": 134,
    "titulo": "Estallido de la rebelión de los Países Bajos contra el dominio español",
    "anio": 1566,
    "descripcion": "Alerta de baja prioridad: \"Estallido de la rebelión de los Países Bajos contra el dominio español\". Ni rastro de paradojas ni de becarios torpes en las cercanías."
  },
  {
    "id": 135,
    "titulo": "Llegada del Duque de Alba a Bruselas al mando del Tribunal de los Tumultos",
    "anio": 1567,
    "descripcion": "Registro del Cronolito: \"Llegada del Duque de Alba a Bruselas al mando del Tribunal de los Tumultos\". Los Arquitectos confirman que, efectivamente, esto pasó ANTES de que existiera el wifi."
  },
  {
    "id": 136,
    "titulo": "Inicio de la Guerra de las Alpujarras por la rebelión de los moriscos granadinos",
    "anio": 1568,
    "descripcion": "Nota del becario al margen: \"Inicio de la Guerra de las Alpujarras por la rebelión de los moriscos granadinos\". (Sigo sin encontrar el cable de la aspiradora, por cierto)."
  },
  {
    "id": 137,
    "titulo": "Creación de la Unión de Lublin que une a Polonia y Lituania en una confederación",
    "anio": 1569,
    "descripcion": "Escaneo temporal completado: \"Creación de la Unión de Lublin que une a Polonia y Lituania en una confederación\". Ningún dinosaurio fue visto grabando esto para TikTok. De momento."
  },
  {
    "id": 138,
    "titulo": "Pío V excomulga a la reina Isabel I de Inglaterra mediante bula papal",
    "anio": 1570,
    "descripcion": "Fragmento recuperado del Cronolito: \"Pío V excomulga a la reina Isabel I de Inglaterra mediante bula papal\". Coeficiente de paradoja: bajo. Se puede archivar sin pánico."
  },
  {
    "id": 139,
    "titulo": "La Liga Santa derrota a la flota otomana en la Batalla de Lepanto",
    "anio": 1571,
    "descripcion": "El sensor de coherencia temporal susurra: \"La Liga Santa derrota a la flota otomana en la Batalla de Lepanto\". Nada de esto debería sorprenderte, viajero."
  },
  {
    "id": 140,
    "titulo": "Matanza de San Bartolomé contra los hugonotes en las calles de París",
    "anio": 1572,
    "descripcion": "Bitácora de los Arquitectos del Tiempo: \"Matanza de San Bartolomé contra los hugonotes en las calles de París\". Otro ladrillo más en el muro de la Historia (con mayúscula)."
  },
  {
    "id": 141,
    "titulo": "Fin del Sitio de Haarlem por las tropas españolas durante la Guerra de Flandes",
    "anio": 1573,
    "descripcion": "Aviso desde el centro de control: \"Fin del Sitio de Haarlem por las tropas españolas durante la Guerra de Flandes\". Se ruega no tocar nada más, ya tuvimos suficiente con la aspiradora."
  },
  {
    "id": 142,
    "titulo": "Los otomanos arrebatan definitivamente la ciudad de Túnez al Imperio Español",
    "anio": 1574,
    "descripcion": "Eco cronológico detectado: \"Los otomanos arrebatan definitivamente la ciudad de Túnez al Imperio Español\". Verificado por triplicado — el tejido espacio-tiempo lo agradece."
  },
  {
    "id": 143,
    "titulo": "Segunda quiebra de la hacienda real durante el reinado de Felipe II",
    "anio": 1575,
    "descripcion": "El Cronolito parpadea y muestra: \"Segunda quiebra de la hacienda real durante el reinado de Felipe II\". Colócalo bien o la humanidad se queda sin wifi para siempre."
  },
  {
    "id": 144,
    "titulo": "Saqueo de Amberes por las tropas españolas amotinadas por falta de pagas",
    "anio": 1576,
    "descripcion": "Informe de campo: \"Saqueo de Amberes por las tropas españolas amotinadas por falta de pagas\". Ni una paradoja a la vista. Por ahora."
  },
  {
    "id": 145,
    "titulo": "Francis Drake inicia su viaje de circunnavegación a bordo del Golden Hind",
    "anio": 1577,
    "descripcion": "Susurro del pasado captado por los sensores: \"Francis Drake inicia su viaje de circunnavegación a bordo del Golden Hind\". Archívalo antes de que el café se enfríe."
  },
  {
    "id": 146,
    "titulo": "Desastre de la Batalla de Alcazarquivir donde desaparece el rey Sebastián de Portugal",
    "anio": 1578,
    "descripcion": "El oráculo temporal certifica: \"Desastre de la Batalla de Alcazarquivir donde desaparece el rey Sebastián de Portugal\". Esto sí que pasó, no como lo del becario y la aspiradora."
  },
  {
    "id": 147,
    "titulo": "Firma de la Unión de Utrecht que sienta las bases de las Provincias Unidas",
    "anio": 1579,
    "descripcion": "Pieza recuperada del suelo de la sala del Cronolito: \"Firma de la Unión de Utrecht que sienta las bases de las Provincias Unidas\". Un poco de polvo, pero intacta."
  },
  {
    "id": 148,
    "titulo": "Unión Ibérica con la incorporación de Portugal a los dominios de Felipe II",
    "anio": 1580,
    "descripcion": "Consulta al archivo maestro: \"Unión Ibérica con la incorporación de Portugal a los dominios de Felipe II\". Coincide con los registros oficiales de la Orden."
  },
  {
    "id": 149,
    "titulo": "Las Provincias Unidas declaran su independencia formal de España",
    "anio": 1581,
    "descripcion": "Alerta de baja prioridad: \"Las Provincias Unidas declaran su independencia formal de España\". Ni rastro de paradojas ni de becarios torpes en las cercanías."
  },
  {
    "id": 150,
    "titulo": "Entrada en vigor del calendario gregoriano en los países católicos europeos",
    "anio": 1582,
    "descripcion": "Registro del Cronolito: \"Entrada en vigor del calendario gregoriano en los países católicos europeos\". Los Arquitectos confirman que, efectivamente, esto pasó ANTES de que existiera el wifi."
  },
  {
    "id": 151,
    "titulo": "El jesuita Matteo Ricci llega a China iniciando las misiones en Pekín",
    "anio": 1583,
    "descripcion": "Nota del becario al margen: \"El jesuita Matteo Ricci llega a China iniciando las misiones en Pekín\". (Sigo sin encontrar el cable de la aspiradora, por cierto)."
  },
  {
    "id": 152,
    "titulo": "Finalización de las obras arquitectónicas del Monasterio de El Escorial",
    "anio": 1584,
    "descripcion": "Escaneo temporal completado: \"Finalización de las obras arquitectónicas del Monasterio de El Escorial\". Ningún dinosaurio fue visto grabando esto para TikTok. De momento."
  },
  {
    "id": 153,
    "titulo": "Inicio de la Guerra de los Tres Enriques en Francia por la sucesión al trono",
    "anio": 1585,
    "descripcion": "Fragmento recuperado del Cronolito: \"Inicio de la Guerra de los Tres Enriques en Francia por la sucesión al trono\". Coeficiente de paradoja: bajo. Se puede archivar sin pánico."
  },
  {
    "id": 154,
    "titulo": "Fracaso del complot de Babington para asesinar a la reina Isabel I de Inglaterra",
    "anio": 1586,
    "descripcion": "El sensor de coherencia temporal susurra: \"Fracaso del complot de Babington para asesinar a la reina Isabel I de Inglaterra\". Nada de esto debería sorprenderte, viajero."
  },
  {
    "id": 155,
    "titulo": "Ejecución de María Estuardo, reina de Escocia, por orden de Isabel I",
    "anio": 1587,
    "descripcion": "Bitácora de los Arquitectos del Tiempo: \"Ejecución de María Estuardo, reina de Escocia, por orden de Isabel I\". Otro ladrillo más en el muro de la Historia (con mayúscula)."
  },
  {
    "id": 156,
    "titulo": "Derrota de la Armada Invencible española enviada contra Inglaterra",
    "anio": 1588,
    "descripcion": "Aviso desde el centro de control: \"Derrota de la Armada Invencible española enviada contra Inglaterra\". Se ruega no tocar nada más, ya tuvimos suficiente con la aspiradora."
  },
  {
    "id": 157,
    "titulo": "Asesinato de Enrique III de Francia y ascenso de Enrique IV al trono",
    "anio": 1589,
    "descripcion": "Eco cronológico detectado: \"Asesinato de Enrique III de Francia y ascenso de Enrique IV al trono\". Verificado por triplicado — el tejido espacio-tiempo lo agradece."
  },
  {
    "id": 158,
    "titulo": "Inauguración del telescopio óptico compuesto atribuido a Zacharias Janssen",
    "anio": 1590,
    "descripcion": "El Cronolito parpadea y muestra: \"Inauguración del telescopio óptico compuesto atribuido a Zacharias Janssen\". Colócalo bien o la humanidad se queda sin wifi para siempre."
  },
  {
    "id": 159,
    "titulo": "Supresión de las alteraciones de Aragón tras la huida de Antonio Pérez",
    "anio": 1591,
    "descripcion": "Informe de campo: \"Supresión de las alteraciones de Aragón tras la huida de Antonio Pérez\". Ni una paradoja a la vista. Por ahora."
  },
  {
    "id": 160,
    "titulo": "Estallido de las invasiones japonesas a Corea lideradas por Toyotomi Hideyoshi",
    "anio": 1592,
    "descripcion": "Susurro del pasado captado por los sensores: \"Estallido de las invasiones japonesas a Corea lideradas por Toyotomi Hideyoshi\". Archívalo antes de que el café se enfríe."
  },
  {
    "id": 161,
    "titulo": "Enrique IV de Francia se convierte al catolicismo para poder reinar pacíficamente",
    "anio": 1593,
    "descripcion": "El oráculo temporal certifica: \"Enrique IV de Francia se convierte al catolicismo para poder reinar pacíficamente\". Esto sí que pasó, no como lo del becario y la aspiradora."
  },
  {
    "id": 162,
    "titulo": "Coronación formal de Enrique IV de Francia en la catedral de Chartres",
    "anio": 1594,
    "descripcion": "Pieza recuperada del suelo de la sala del Cronolito: \"Coronación formal de Enrique IV de Francia en la catedral de Chartres\". Un poco de polvo, pero intacta."
  },
  {
    "id": 163,
    "titulo": "Publicación del primer volumen de los Ensayos de Michel de Montaigne",
    "anio": 1595,
    "descripcion": "Consulta al archivo maestro: \"Publicación del primer volumen de los Ensayos de Michel de Montaigne\". Coincide con los registros oficiales de la Orden."
  },
  {
    "id": 164,
    "titulo": "Nacimiento del filósofo francés René Descartes en La Haye en Touraine",
    "anio": 1596,
    "descripcion": "Alerta de baja prioridad: \"Nacimiento del filósofo francés René Descartes en La Haye en Touraine\". Ni rastro de paradojas ni de becarios torpes en las cercanías."
  },
  {
    "id": 165,
    "titulo": "Ejecución de los 26 mártires de Nagasaki por orden de las autoridades japonesas",
    "anio": 1597,
    "descripcion": "Registro del Cronolito: \"Ejecución de los 26 mártires de Nagasaki por orden de las autoridades japonesas\". Los Arquitectos confirman que, efectivamente, esto pasó ANTES de que existiera el wifi."
  },
  {
    "id": 166,
    "titulo": "Promulgación del Edicto de Nantes que otorga tolerancia religiosa en Francia",
    "anio": 1598,
    "descripcion": "Nota del becario al margen: \"Promulgación del Edicto de Nantes que otorga tolerancia religiosa en Francia\". (Sigo sin encontrar el cable de la aspiradora, por cierto)."
  },
  {
    "id": 167,
    "titulo": "Nacimiento del pintor barroco español Diego Velázquez en Sevilla",
    "anio": 1599,
    "descripcion": "Escaneo temporal completado: \"Nacimiento del pintor barroco español Diego Velázquez en Sevilla\". Ningún dinosaurio fue visto grabando esto para TikTok. De momento."
  },
  {
    "id": 168,
    "titulo": "Fundación de la Compañía Británica de las Indias Orientales por cédula real",
    "anio": 1600,
    "descripcion": "Fragmento recuperado del Cronolito: \"Fundación de la Compañía Británica de las Indias Orientales por cédula real\". Coeficiente de paradoja: bajo. Se puede archivar sin pánico."
  },
  {
    "id": 169,
    "titulo": "Estreno estimado de la tragedia Hamlet de William Shakespeare en Londres",
    "anio": 1601,
    "descripcion": "El sensor de coherencia temporal susurra: \"Estreno estimado de la tragedia Hamlet de William Shakespeare en Londres\". Nada de esto debería sorprenderte, viajero."
  },
  {
    "id": 170,
    "titulo": "Fundación de la Compañía Neerlandesa de las Indias Orientales",
    "anio": 1602,
    "descripcion": "Bitácora de los Arquitectos del Tiempo: \"Fundación de la Compañía Neerlandesa de las Indias Orientales\". Otro ladrillo más en el muro de la Historia (con mayúscula)."
  },
  {
    "id": 171,
    "titulo": "Muerte de Isabel I de Inglaterra y ascenso de Jacobo I, uniendo las coronas",
    "anio": 1603,
    "descripcion": "Aviso desde el centro de control: \"Muerte de Isabel I de Inglaterra y ascenso de Jacobo I, uniendo las coronas\". Se ruega no tocar nada más, ya tuvimos suficiente con la aspiradora."
  },
  {
    "id": 172,
    "titulo": "Firma del Tratado de Londres que pone fin a la guerra anglo-española",
    "anio": 1604,
    "descripcion": "Eco cronológico detectado: \"Firma del Tratado de Londres que pone fin a la guerra anglo-española\". Verificado por triplicado — el tejido espacio-tiempo lo agradece."
  },
  {
    "id": 173,
    "titulo": "Publicación de la primera parte de Don Quijote de la Mancha de Cervantes",
    "anio": 1605,
    "descripcion": "El Cronolito parpadea y muestra: \"Publicación de la primera parte de Don Quijote de la Mancha de Cervantes\". Colócalo bien o la humanidad se queda sin wifi para siempre."
  },
  {
    "id": 174,
    "titulo": "La expedición de Willem Janszoon realiza el primer avistamiento europeo de Australia",
    "anio": 1606,
    "descripcion": "Informe de campo: \"La expedición de Willem Janszoon realiza el primer avistamiento europeo de Australia\". Ni una paradoja a la vista. Por ahora."
  },
  {
    "id": 175,
    "titulo": "Fundación de Jamestown, el primer asentamiento inglés permanente en Norteamérica",
    "anio": 1607,
    "descripcion": "Susurro del pasado captado por los sensores: \"Fundación de Jamestown, el primer asentamiento inglés permanente en Norteamérica\". Archívalo antes de que el café se enfríe."
  },
  {
    "id": 176,
    "titulo": "Fundación de la ciudad de Quebec por el explorador francés Samuel de Champlain",
    "anio": 1608,
    "descripcion": "El oráculo temporal certifica: \"Fundación de la ciudad de Quebec por el explorador francés Samuel de Champlain\". Esto sí que pasó, no como lo del becario y la aspiradora."
  },
  {
    "id": 177,
    "titulo": "Expulsión de los moriscos de los reinos de la Monarquía Hispánica",
    "anio": 1609,
    "descripcion": "Pieza recuperada del suelo de la sala del Cronolito: \"Expulsión de los moriscos de los reinos de la Monarquía Hispánica\". Un poco de polvo, pero intacta."
  },
  {
    "id": 178,
    "titulo": "Asesinato de Enrique IV de Francia y regencia de María de Médici",
    "anio": 1610,
    "descripcion": "Consulta al archivo maestro: \"Asesinato de Enrique IV de Francia y regencia de María de Médici\". Coincide con los registros oficiales de la Orden."
  },
  {
    "id": 179,
    "titulo": "Publicación de la Biblia del Rey Jacobo, traducción oficial al inglés",
    "anio": 1611,
    "descripcion": "Alerta de baja prioridad: \"Publicación de la Biblia del Rey Jacobo, traducción oficial al inglés\". Ni rastro de paradojas ni de becarios torpes en las cercanías."
  },
  {
    "id": 180,
    "titulo": "Fallecimiento del emperador Rodolfo II de Habsburgo en Praga",
    "anio": 1612,
    "descripcion": "Registro del Cronolito: \"Fallecimiento del emperador Rodolfo II de Habsburgo en Praga\". Los Arquitectos confirman que, efectivamente, esto pasó ANTES de que existiera el wifi."
  },
  {
    "id": 181,
    "titulo": "Ascenso de Miguel I al trono de Rusia, dando inicio a la dinastía Romanov",
    "anio": 1613,
    "descripcion": "Nota del becario al margen: \"Ascenso de Miguel I al trono de Rusia, dando inicio a la dinastía Romanov\". (Sigo sin encontrar el cable de la aspiradora, por cierto)."
  },
  {
    "id": 182,
    "titulo": "Última convocatoria de los Estados Generales en Francia antes de la Revolución",
    "anio": 1614,
    "descripcion": "Escaneo temporal completado: \"Última convocatoria de los Estados Generales en Francia antes de la Revolución\". Ningún dinosaurio fue visto grabando esto para TikTok. De momento."
  },
  {
    "id": 183,
    "titulo": "Publicación de la segunda parte del Quijote de Miguel de Cervantes",
    "anio": 1615,
    "descripcion": "Fragmento recuperado del Cronolito: \"Publicación de la segunda parte del Quijote de Miguel de Cervantes\". Coeficiente de paradoja: bajo. Se puede archivar sin pánico."
  },
  {
    "id": 184,
    "titulo": "Fallecimiento de William Shakespeare y Miguel de Cervantes Saavedra",
    "anio": 1616,
    "descripcion": "El sensor de coherencia temporal susurra: \"Fallecimiento de William Shakespeare y Miguel de Cervantes Saavedra\". Nada de esto debería sorprenderte, viajero."
  },
  {
    "id": 185,
    "titulo": "Firma del Tratado de Stolbovo que pone fin a la guerra de Ingria",
    "anio": 1617,
    "descripcion": "Bitácora de los Arquitectos del Tiempo: \"Firma del Tratado de Stolbovo que pone fin a la guerra de Ingria\". Otro ladrillo más en el muro de la Historia (con mayúscula)."
  },
  {
    "id": 186,
    "titulo": "La Defenestración de Praga desencadena la Guerra de los Treinta Años",
    "anio": 1618,
    "descripcion": "Aviso desde el centro de control: \"La Defenestración de Praga desencadena la Guerra de los Treinta Años\". Se ruega no tocar nada más, ya tuvimos suficiente con la aspiradora."
  },
  {
    "id": 187,
    "titulo": "Llegada de los primeros barcos con esclavos africanos documentados a Virginia",
    "anio": 1619,
    "descripcion": "Eco cronológico detectado: \"Llegada de los primeros barcos con esclavos africanos documentados a Virginia\". Verificado por triplicado — el tejido espacio-tiempo lo agradece."
  },
  {
    "id": 188,
    "titulo": "Los Padres Peregrinos del Mayflower desembarcan en Plymouth, Norteamérica",
    "anio": 1620,
    "descripcion": "El Cronolito parpadea y muestra: \"Los Padres Peregrinos del Mayflower desembarcan en Plymouth, Norteamérica\". Colócalo bien o la humanidad se queda sin wifi para siempre."
  },
  {
    "id": 189,
    "titulo": "Fin de la Tregua de los Doce Años y reanudación de la guerra en Flandes",
    "anio": 1621,
    "descripcion": "Informe de campo: \"Fin de la Tregua de los Doce Años y reanudación de la guerra en Flandes\". Ni una paradoja a la vista. Por ahora."
  },
  {
    "id": 190,
    "titulo": "Canonización de Ignacio de Loyola, Francisco Javier y Teresa de Jesús",
    "anio": 1622,
    "descripcion": "Susurro del pasado captado por los sensores: \"Canonización de Ignacio de Loyola, Francisco Javier y Teresa de Jesús\". Archívalo antes de que el café se enfríe."
  },
  {
    "id": 191,
    "titulo": "Inauguración del Palacio de Versalles como pabellón de caza por Luis XIII",
    "anio": 1623,
    "descripcion": "El oráculo temporal certifica: \"Inauguración del Palacio de Versalles como pabellón de caza por Luis XIII\". Esto sí que pasó, no como lo del becario y la aspiradora."
  },
  {
    "id": 192,
    "titulo": "El cardenal Richelieu es nombrado ministro principal del rey Luis XIII de Francia",
    "anio": 1624,
    "descripcion": "Pieza recuperada del suelo de la sala del Cronolito: \"El cardenal Richelieu es nombrado ministro principal del rey Luis XIII de Francia\". Un poco de polvo, pero intacta."
  },
  {
    "id": 193,
    "titulo": "Rendición de la ciudad de Breda ante las tropas españolas de Ambrosio Spinola",
    "anio": 1625,
    "descripcion": "Consulta al archivo maestro: \"Rendición de la ciudad de Breda ante las tropas españolas de Ambrosio Spinola\". Coincide con los registros oficiales de la Orden."
  },
  {
    "id": 194,
    "titulo": "Consagración definitiva de la nueva Basílica de San Pedro en el Vaticano",
    "anio": 1626,
    "descripcion": "Alerta de baja prioridad: \"Consagración definitiva de la nueva Basílica de San Pedro en el Vaticano\". Ni rastro de paradojas ni de becarios torpes en las cercanías."
  },
  {
    "id": 195,
    "titulo": "Inicio del Sitio de La Rochelle por las fuerzas reales francesas de Richelieu",
    "anio": 1627,
    "descripcion": "Registro del Cronolito: \"Inicio del Sitio de La Rochelle por las fuerzas reales francesas de Richelieu\". Los Arquitectos confirman que, efectivamente, esto pasó ANTES de que existiera el wifi."
  },
  {
    "id": 196,
    "titulo": "El corsario neerlandés Piet Hein captura la Flota de Indias española en Matanzas",
    "anio": 1628,
    "descripcion": "Nota del becario al margen: \"El corsario neerlandés Piet Hein captura la Flota de Indias española en Matanzas\". (Sigo sin encontrar el cable de la aspiradora, por cierto)."
  },
  {
    "id": 197,
    "titulo": "Firma del Edicto de Restitución por el emperador Fernando II de Habsburgo",
    "anio": 1629,
    "descripcion": "Escaneo temporal completado: \"Firma del Edicto de Restitución por el emperador Fernando II de Habsburgo\". Ningún dinosaurio fue visto grabando esto para TikTok. De momento."
  },
  {
    "id": 198,
    "titulo": "Fundación de la ciudad de Boston por colonos puritanos ingleses",
    "anio": 1630,
    "descripcion": "Fragmento recuperado del Cronolito: \"Fundación de la ciudad de Boston por colonos puritanos ingleses\". Coeficiente de paradoja: bajo. Se puede archivar sin pánico."
  },
  {
    "id": 199,
    "titulo": "Erupción violenta del monte Vesubio que destruye varias poblaciones costeras",
    "anio": 1631,
    "descripcion": "El sensor de coherencia temporal susurra: \"Erupción violenta del monte Vesubio que destruye varias poblaciones costeras\". Nada de esto debería sorprenderte, viajero."
  },
  {
    "id": 200,
    "titulo": "Batalla de Lützen y muerte del rey Gustavo II Adolfo de Suecia",
    "anio": 1632,
    "descripcion": "Bitácora de los Arquitectos del Tiempo: \"Batalla de Lützen y muerte del rey Gustavo II Adolfo de Suecia\". Otro ladrillo más en el muro de la Historia (con mayúscula)."
  },
  {
    "id": 201,
    "titulo": "Galileo Galilei es condenado por la Inquisición y obligado a abjurar",
    "anio": 1633,
    "descripcion": "Aviso desde el centro de control: \"Galileo Galilei es condenado por la Inquisición y obligado a abjurar\". Se ruega no tocar nada más, ya tuvimos suficiente con la aspiradora."
  },
  {
    "id": 202,
    "titulo": "Batalla de Nördlingen, gran victoria de las tropas imperiales y españolas",
    "anio": 1634,
    "descripcion": "Eco cronológico detectado: \"Batalla de Nördlingen, gran victoria de las tropas imperiales y españolas\". Verificado por triplicado — el tejido espacio-tiempo lo agradece."
  },
  {
    "id": 203,
    "titulo": "Francia declara la guerra a España interviniendo en la Guerra de los Treinta Años",
    "anio": 1635,
    "descripcion": "El Cronolito parpadea y muestra: \"Francia declara la guerra a España interviniendo en la Guerra de los Treinta Años\". Colócalo bien o la humanidad se queda sin wifi para siempre."
  },
  {
    "id": 204,
    "titulo": "Fundación de la Universidad de Harvard bajo el nombre de New College",
    "anio": 1636,
    "descripcion": "Informe de campo: \"Fundación de la Universidad de Harvard bajo el nombre de New College\". Ni una paradoja a la vista. Por ahora."
  },
  {
    "id": 205,
    "titulo": "Estallido de la crisis de los tulipanes en las Provincias Unidas",
    "anio": 1637,
    "descripcion": "Susurro del pasado captado por los sensores: \"Estallido de la crisis de los tulipanes en las Provincias Unidas\". Archívalo antes de que el café se enfríe."
  },
  {
    "id": 206,
    "titulo": "Firma del National Covenant por los presbiterianos de Escocia",
    "anio": 1638,
    "descripcion": "El oráculo temporal certifica: \"Firma del National Covenant por los presbiterianos de Escocia\". Esto sí que pasó, no como lo del becario y la aspiradora."
  },
  {
    "id": 207,
    "titulo": "Inicio de las Guerras de los Tres Reinos en las Islas Británicas",
    "anio": 1639,
    "descripcion": "Pieza recuperada del suelo de la sala del Cronolito: \"Inicio de las Guerras de los Tres Reinos en las Islas Británicas\". Un poco de polvo, pero intacta."
  },
  {
    "id": 208,
    "titulo": "Sublevación de Cataluña y rebelión independentista de Portugal contra España",
    "anio": 1640,
    "descripcion": "Consulta al archivo maestro: \"Sublevación de Cataluña y rebelión independentista de Portugal contra España\". Coincide con los registros oficiales de la Orden."
  },
  {
    "id": 209,
    "titulo": "Estallido de la Rebelión Irlandesa contra los colonos protestantes ingleses",
    "anio": 1641,
    "descripcion": "Alerta de baja prioridad: \"Estallido de la Rebelión Irlandesa contra los colonos protestantes ingleses\". Ni rastro de paradojas ni de becarios torpes en las cercanías."
  },
  {
    "id": 210,
    "titulo": "Inicio de la Guerra Civil Inglesa entre parlamentarios y realistas",
    "anio": 1642,
    "descripcion": "Registro del Cronolito: \"Inicio de la Guerra Civil Inglesa entre parlamentarios y realistas\". Los Arquitectos confirman que, efectivamente, esto pasó ANTES de que existiera el wifi."
  },
  {
    "id": 211,
    "titulo": "Ascenso de Luis XIV al trono de Francia bajo la regencia de Ana de Austria",
    "anio": 1643,
    "descripcion": "Nota del becario al margen: \"Ascenso de Luis XIV al trono de Francia bajo la regencia de Ana de Austria\". (Sigo sin encontrar el cable de la aspiradora, por cierto)."
  },
  {
    "id": 212,
    "titulo": "La dinastía Qing toma Pekín iniciando el dominio manchú sobre China",
    "anio": 1644,
    "descripcion": "Escaneo temporal completado: \"La dinastía Qing toma Pekín iniciando el dominio manchú sobre China\". Ningún dinosaurio fue visto grabando esto para TikTok. De momento."
  },
  {
    "id": 213,
    "titulo": "Batalla de Naseby, victoria decisiva del Nuevo Ejército Modelo de Cromwell",
    "anio": 1645,
    "descripcion": "Fragmento recuperado del Cronolito: \"Batalla de Naseby, victoria decisiva del Nuevo Ejército Modelo de Cromwell\". Coeficiente de paradoja: bajo. Se puede archivar sin pánico."
  },
  {
    "id": 214,
    "titulo": "Rendición del rey Carlos I de Inglaterra ante el ejército escocés",
    "anio": 1646,
    "descripcion": "El sensor de coherencia temporal susurra: \"Rendición del rey Carlos I de Inglaterra ante el ejército escocés\". Nada de esto debería sorprenderte, viajero."
  },
  {
    "id": 215,
    "titulo": "Estallido de la revuelta popular de Masaniello en la ciudad de Nápoles",
    "anio": 1647,
    "descripcion": "Bitácora de los Arquitectos del Tiempo: \"Estallido de la revuelta popular de Masaniello en la ciudad de Nápoles\". Otro ladrillo más en el muro de la Historia (con mayúscula)."
  },
  {
    "id": 216,
    "titulo": "Paz de Westfalia que pone fin a la Guerra de los Treinta Años",
    "anio": 1648,
    "descripcion": "Aviso desde el centro de control: \"Paz de Westfalia que pone fin a la Guerra de los Treinta Años\". Se ruega no tocar nada más, ya tuvimos suficiente con la aspiradora."
  },
  {
    "id": 217,
    "titulo": "Decapitación del rey Carlos I y proclamación de la Mancomunidad de Inglaterra",
    "anio": 1649,
    "descripcion": "Eco cronológico detectado: \"Decapitación del rey Carlos I y proclamación de la Mancomunidad de Inglaterra\". Verificado por triplicado — el tejido espacio-tiempo lo agradece."
  },
  {
    "id": 218,
    "titulo": "Fallecimiento del filósofo René Descartes en Estocolmo, Suecia",
    "anio": 1650,
    "descripcion": "El Cronolito parpadea y muestra: \"Fallecimiento del filósofo René Descartes en Estocolmo, Suecia\". Colócalo bien o la humanidad se queda sin wifi para siempre."
  },
  {
    "id": 219,
    "titulo": "Publicación del tratado político Leviatán de Thomas Hobbes",
    "anio": 1651,
    "descripcion": "Informe de campo: \"Publicación del tratado político Leviatán de Thomas Hobbes\". Ni una paradoja a la vista. Por ahora."
  },
  {
    "id": 220,
    "titulo": "Fundación de Ciudad del Cabo por la Compañía Neerlandesa de las Indias Orientales",
    "anio": 1652,
    "descripcion": "Susurro del pasado captado por los sensores: \"Fundación de Ciudad del Cabo por la Compañía Neerlandesa de las Indias Orientales\". Archívalo antes de que el café se enfríe."
  },
  {
    "id": 221,
    "titulo": "Oliver Cromwell se autoproclama Lord Protector de Inglaterra, Escocia e Irlanda",
    "anio": 1653,
    "descripcion": "El oráculo temporal certifica: \"Oliver Cromwell se autoproclama Lord Protector de Inglaterra, Escocia e Irlanda\". Esto sí que pasó, no como lo del becario y la aspiradora."
  },
  {
    "id": 222,
    "titulo": "Abdicación de la reina Cristina de Suecia tras convertirse al catolicismo",
    "anio": 1654,
    "descripcion": "Pieza recuperada del suelo de la sala del Cronolito: \"Abdicación de la reina Cristina de Suecia tras convertirse al catolicismo\". Un poco de polvo, pero intacta."
  },
  {
    "id": 223,
    "titulo": "Las fuerzas inglesas capturan la isla de Jamaica al Imperio Español",
    "anio": 1655,
    "descripcion": "Consulta al archivo maestro: \"Las fuerzas inglesas capturan la isla de Jamaica al Imperio Español\". Coincide con los registros oficiales de la Orden."
  },
  {
    "id": 224,
    "titulo": "El pintor Diego Velázquez finaliza su obra maestra pictórica Las Meninas",
    "anio": 1656,
    "descripcion": "Alerta de baja prioridad: \"El pintor Diego Velázquez finaliza su obra maestra pictórica Las Meninas\". Ni rastro de paradojas ni de becarios torpes en las cercanías."
  },
  {
    "id": 225,
    "titulo": "Firma del Tratado de Wehlau por el que Prusia obtiene la independencia de Polonia",
    "anio": 1657,
    "descripcion": "Registro del Cronolito: \"Firma del Tratado de Wehlau por el que Prusia obtiene la independencia de Polonia\". Los Arquitectos confirman que, efectivamente, esto pasó ANTES de que existiera el wifi."
  },
  {
    "id": 226,
    "titulo": "Muerte de Oliver Cromwell y sucesión de su hijo Richard como Lord Protector",
    "anio": 1658,
    "descripcion": "Nota del becario al margen: \"Muerte de Oliver Cromwell y sucesión de su hijo Richard como Lord Protector\". (Sigo sin encontrar el cable de la aspiradora, por cierto)."
  },
  {
    "id": 227,
    "titulo": "Firma de la Paz de los Pirineos entre las coronas de España y Francia",
    "anio": 1659,
    "descripcion": "Escaneo temporal completado: \"Firma de la Paz de los Pirineos entre las coronas de España y Francia\". Ningún dinosaurio fue visto grabando esto para TikTok. De momento."
  },
  {
    "id": 228,
    "titulo": "Restauración de la monarquía en Inglaterra con la llegada de Carlos II",
    "anio": 1660,
    "descripcion": "Fragmento recuperado del Cronolito: \"Restauración de la monarquía en Inglaterra con la llegada de Carlos II\". Coeficiente de paradoja: bajo. Se puede archivar sin pánico."
  },
  {
    "id": 229,
    "titulo": "Muerte del cardenal Mazarino y asunción del poder absoluto por Luis XIV",
    "anio": 1661,
    "descripcion": "El sensor de coherencia temporal susurra: \"Muerte del cardenal Mazarino y asunción del poder absoluto por Luis XIV\". Nada de esto debería sorprenderte, viajero."
  },
  {
    "id": 230,
    "titulo": "Promulgación del Acta de Uniformidad en Inglaterra contra los disidentes religiosos",
    "anio": 1662,
    "descripcion": "Bitácora de los Arquitectos del Tiempo: \"Promulgación del Acta de Uniformidad en Inglaterra contra los disidentes religiosos\". Otro ladrillo más en el muro de la Historia (con mayúscula)."
  },
  {
    "id": 231,
    "titulo": "Fundación del asentamiento francés de la Nueva Francia como provincia real",
    "anio": 1663,
    "descripcion": "Aviso desde el centro de control: \"Fundación del asentamiento francés de la Nueva Francia como provincia real\". Se ruega no tocar nada más, ya tuvimos suficiente con la aspiradora."
  },
  {
    "id": 232,
    "titulo": "Los ingleses capturan la ciudad de Nueva Ámsterdam y la rebautizan como Nueva York",
    "anio": 1664,
    "descripcion": "Eco cronológico detectado: \"Los ingleses capturan la ciudad de Nueva Ámsterdam y la rebautizan como Nueva York\". Verificado por triplicado — el tejido espacio-tiempo lo agradece."
  },
  {
    "id": 233,
    "titulo": "Gran Peste de Londres que acaba con casi la cuarta parte de su población",
    "anio": 1665,
    "descripcion": "El Cronolito parpadea y muestra: \"Gran Peste de Londres que acaba con casi la cuarta parte de su población\". Colócalo bien o la humanidad se queda sin wifi para siempre."
  },
  {
    "id": 234,
    "titulo": "Gran Incendio de Londres que destruye el centro histórico de la ciudad",
    "anio": 1666,
    "descripcion": "Informe de campo: \"Gran Incendio de Londres que destruye el centro histórico de la ciudad\". Ni una paradoja a la vista. Por ahora."
  },
  {
    "id": 235,
    "titulo": "Inicio de la Guerra de Devolución entre Francia y la monarquía española",
    "anio": 1667,
    "descripcion": "Susurro del pasado captado por los sensores: \"Inicio de la Guerra de Devolución entre Francia y la monarquía española\". Archívalo antes de que el café se enfríe."
  },
  {
    "id": 236,
    "titulo": "Firma del Tratado de Lisboa por el que España reconoce la independencia de Portugal",
    "anio": 1668,
    "descripcion": "El oráculo temporal certifica: \"Firma del Tratado de Lisboa por el que España reconoce la independencia de Portugal\". Esto sí que pasó, no como lo del becario y la aspiradora."
  },
  {
    "id": 237,
    "titulo": "Los otomanos capturan la fortaleza de Candía terminando la conquista de Creta",
    "anio": 1669,
    "descripcion": "Pieza recuperada del suelo de la sala del Cronolito: \"Los otomanos capturan la fortaleza de Candía terminando la conquista de Creta\". Un poco de polvo, pero intacta."
  },
  {
    "id": 238,
    "titulo": "Firma del Tratado secreto de Dover entre Carlos II de Inglaterra y Luis XIV",
    "anio": 1670,
    "descripcion": "Consulta al archivo maestro: \"Firma del Tratado secreto de Dover entre Carlos II de Inglaterra y Luis XIV\". Coincide con los registros oficiales de la Orden."
  },
  {
    "id": 239,
    "titulo": "El pirata Henry Morgan saquea y destruye la ciudad de Panamá vieja",
    "anio": 1671,
    "descripcion": "Alerta de baja prioridad: \"El pirata Henry Morgan saquea y destruye la ciudad de Panamá vieja\". Ni rastro de paradojas ni de becarios torpes en las cercanías."
  },
  {
    "id": 240,
    "titulo": "El Año del Desastre en las Provincias Unidas ante la invasión francesa",
    "anio": 1672,
    "descripcion": "Registro del Cronolito: \"El Año del Desastre en las Provincias Unidas ante la invasión francesa\". Los Arquitectos confirman que, efectivamente, esto pasó ANTES de que existiera el wifi."
  },
  {
    "id": 241,
    "titulo": "Muerte del dramaturgo francés Molière tras sufrir un colapso en el escenario",
    "anio": 1673,
    "descripcion": "Nota del becario al margen: \"Muerte del dramaturgo francés Molière tras sufrir un colapso en el escenario\". (Sigo sin encontrar el cable de la aspiradora, por cierto)."
  },
  {
    "id": 242,
    "titulo": "Firma del Tratado de Westminster que devuelve Nueva York a manos inglesas",
    "anio": 1674,
    "descripcion": "Escaneo temporal completado: \"Firma del Tratado de Westminster que devuelve Nueva York a manos inglesas\". Ningún dinosaurio fue visto grabando esto para TikTok. De momento."
  },
  {
    "id": 243,
    "titulo": "Fundación del Real Observatorio de Greenwich por orden de Carlos II de Inglaterra",
    "anio": 1675,
    "descripcion": "Fragmento recuperado del Cronolito: \"Fundación del Real Observatorio de Greenwich por orden de Carlos II de Inglaterra\". Coeficiente de paradoja: bajo. Se puede archivar sin pánico."
  },
  {
    "id": 244,
    "titulo": "Estallido de la Rebelión de Bacon en las colonias inglesas de Virginia",
    "anio": 1676,
    "descripcion": "El sensor de coherencia temporal susurra: \"Estallido de la Rebelión de Bacon en las colonias inglesas de Virginia\". Nada de esto debería sorprenderte, viajero."
  },
  {
    "id": 245,
    "titulo": "Matrimonio de María de York con Guillermo de Orange en Londres",
    "anio": 1677,
    "descripcion": "Bitácora de los Arquitectos del Tiempo: \"Matrimonio de María de York con Guillermo de Orange en Londres\". Otro ladrillo más en el muro de la Historia (con mayúscula)."
  },
  {
    "id": 246,
    "titulo": "Firma de la Paz de Nimega entre Luis XIV de Francia y sus enemigos europeos",
    "anio": 1678,
    "descripcion": "Aviso desde el centro de control: \"Firma de la Paz de Nimega entre Luis XIV de Francia y sus enemigos europeos\". Se ruega no tocar nada más, ya tuvimos suficiente con la aspiradora."
  },
  {
    "id": 247,
    "titulo": "Aprobación del Acta de Habeas Corpus por el Parlamento de Inglaterra",
    "anio": 1679,
    "descripcion": "Eco cronológico detectado: \"Aprobación del Acta de Habeas Corpus por el Parlamento de Inglaterra\". Verificado por triplicado — el tejido espacio-tiempo lo agradece."
  },
  {
    "id": 248,
    "titulo": "Rebelión de los indios Pueblo contra la colonización española en Nuevo México",
    "anio": 1680,
    "descripcion": "El Cronolito parpadea y muestra: \"Rebelión de los indios Pueblo contra la colonización española en Nuevo México\". Colócalo bien o la humanidad se queda sin wifi para siempre."
  },
  {
    "id": 249,
    "titulo": "William Penn recibe la cédula real para fundar la colonia de Pensilvania",
    "anio": 1681,
    "descripcion": "Informe de campo: \"William Penn recibe la cédula real para fundar la colonia de Pensilvania\". Ni una paradoja a la vista. Por ahora."
  },
  {
    "id": 250,
    "titulo": "Robert de La Salle reclama toda la cuenca del Misisipi para Francia como Luisiana",
    "anio": 1682,
    "descripcion": "Susurro del pasado captado por los sensores: \"Robert de La Salle reclama toda la cuenca del Misisipi para Francia como Luisiana\". Archívalo antes de que el café se enfríe."
  },
  {
    "id": 251,
    "titulo": "Segundo Sitio de Viena y victoria de las tropas aliadas cristianas sobre los otomanos",
    "anio": 1683,
    "descripcion": "El oráculo temporal certifica: \"Segundo Sitio de Viena y victoria de las tropas aliadas cristianas sobre los otomanos\". Esto sí que pasó, no como lo del becario y la aspiradora."
  },
  {
    "id": 252,
    "titulo": "Firma de la Tregua de Ratisbona entre Francia, España y el Sacro Imperio",
    "anio": 1684,
    "descripcion": "Pieza recuperada del suelo de la sala del Cronolito: \"Firma de la Tregua de Ratisbona entre Francia, España y el Sacro Imperio\". Un poco de polvo, pero intacta."
  },
  {
    "id": 253,
    "titulo": "Luis XIV promulga el Edicto de Fontainebleau revocando el Edicto de Nantes",
    "anio": 1685,
    "descripcion": "Consulta al archivo maestro: \"Luis XIV promulga el Edicto de Fontainebleau revocando el Edicto de Nantes\". Coincide con los registros oficiales de la Orden."
  },
  {
    "id": 254,
    "titulo": "Creación de la Liga de Augsburgo para frenar el expansionismo de Luis XIV",
    "anio": 1686,
    "descripcion": "Alerta de baja prioridad: \"Creación de la Liga de Augsburgo para frenar el expansionismo de Luis XIV\". Ni rastro de paradojas ni de becarios torpes en las cercanías."
  },
  {
    "id": 255,
    "titulo": "Isaac Newton publica los Philosophiæ Naturalis Principia Mathematica",
    "anio": 1687,
    "descripcion": "Registro del Cronolito: \"Isaac Newton publica los Philosophiæ Naturalis Principia Mathematica\". Los Arquitectos confirman que, efectivamente, esto pasó ANTES de que existiera el wifi."
  },
  {
    "id": 256,
    "titulo": "Estallido de la Revolución Gloriosa en Inglaterra contra el rey Jacobo II",
    "anio": 1688,
    "descripcion": "Nota del becario al margen: \"Estallido de la Revolución Gloriosa en Inglaterra contra el rey Jacobo II\". (Sigo sin encontrar el cable de la aspiradora, por cierto)."
  },
  {
    "id": 257,
    "titulo": "Promulgación de la Declaración de Derechos en el Parlamento inglés",
    "anio": 1689,
    "descripcion": "Escaneo temporal completado: \"Promulgación de la Declaración de Derechos en el Parlamento inglés\". Ningún dinosaurio fue visto grabando esto para TikTok. De momento."
  },
  {
    "id": 258,
    "titulo": "Batalla del Boyne en Irlanda donde Guillermo de Orange derrota a los jacobitas",
    "anio": 1690,
    "descripcion": "Fragmento recuperado del Cronolito: \"Batalla del Boyne en Irlanda donde Guillermo de Orange derrota a los jacobitas\". Coeficiente de paradoja: bajo. Se puede archivar sin pánico."
  },
  {
    "id": 259,
    "titulo": "Firma del Tratado de Limerick que pone fin a la guerra jacobita irlandesa",
    "anio": 1691,
    "descripcion": "El sensor de coherencia temporal susurra: \"Firma del Tratado de Limerick que pone fin a la guerra jacobita irlandesa\". Nada de esto debería sorprenderte, viajero."
  },
  {
    "id": 260,
    "titulo": "Celebración de los juicios por brujería en la aldea de Salem, Massachusetts",
    "anio": 1692,
    "descripcion": "Bitácora de los Arquitectos del Tiempo: \"Celebración de los juicios por brujería en la aldea de Salem, Massachusetts\". Otro ladrillo más en el muro de la Historia (con mayúscula)."
  },
  {
    "id": 261,
    "titulo": "Erupción del monte Etna y terremoto devastador en la isla de Sicilia",
    "anio": 1693,
    "descripcion": "Aviso desde el centro de control: \"Erupción del monte Etna y terremoto devastador en la isla de Sicilia\". Se ruega no tocar nada más, ya tuvimos suficiente con la aspiradora."
  },
  {
    "id": 262,
    "titulo": "Fundación oficial del Banco de Inglaterra como sociedad anónima",
    "anio": 1694,
    "descripcion": "Eco cronológico detectado: \"Fundación oficial del Banco de Inglaterra como sociedad anónima\". Verificado por triplicado — el tejido espacio-tiempo lo agradece."
  },
  {
    "id": 263,
    "titulo": "Destrucción del centro de Bruselas por el bombardeo de las tropas francesas",
    "anio": 1695,
    "descripcion": "El Cronolito parpadea y muestra: \"Destrucción del centro de Bruselas por el bombardeo de las tropas francesas\". Colócalo bien o la humanidad se queda sin wifi para siempre."
  },
  {
    "id": 264,
    "titulo": "Fallecimiento del rey Iván V de Rusia dejando a Pedro el Grande como único zar",
    "anio": 1696,
    "descripcion": "Informe de campo: \"Fallecimiento del rey Iván V de Rusia dejando a Pedro el Grande como único zar\". Ni una paradoja a la vista. Por ahora."
  },
  {
    "id": 265,
    "titulo": "Firma del Tratado de Rijswijk que pone fin a la Guerra de los Nueve Años",
    "anio": 1697,
    "descripcion": "Susurro del pasado captado por los sensores: \"Firma del Tratado de Rijswijk que pone fin a la Guerra de los Nueve Años\". Archívalo antes de que el café se enfríe."
  },
  {
    "id": 266,
    "titulo": "Pedro el Grande introduce el impuesto a las barbas para modernizar Rusia",
    "anio": 1698,
    "descripcion": "El oráculo temporal certifica: \"Pedro el Grande introduce el impuesto a las barbas para modernizar Rusia\". Esto sí que pasó, no como lo del becario y la aspiradora."
  },
  {
    "id": 267,
    "titulo": "Firma de la Paz de Karlowitz que marca el declive otomano en Europa Central",
    "anio": 1699,
    "descripcion": "Pieza recuperada del suelo de la sala del Cronolito: \"Firma de la Paz de Karlowitz que marca el declive otomano en Europa Central\". Un poco de polvo, pero intacta."
  },
  {
    "id": 268,
    "titulo": "Muerte del rey Carlos II de España sin descendencia directa dejando el trono a los Borbones",
    "anio": 1700,
    "descripcion": "Consulta al archivo maestro: \"Muerte del rey Carlos II de España sin descendencia directa dejando el trono a los Borbones\". Coincide con los registros oficiales de la Orden."
  },
  {
    "id": 269,
    "titulo": "Inicio de la Guerra de Sucesión Española por la corona hispánica",
    "anio": 1701,
    "descripcion": "Alerta de baja prioridad: \"Inicio de la Guerra de Sucesión Española por la corona hispánica\". Ni rastro de paradojas ni de becarios torpes en las cercanías."
  },
  {
    "id": 270,
    "titulo": "Ascenso de la reina Ana al trono de Inglaterra, Escocia e Irlanda",
    "anio": 1702,
    "descripcion": "Registro del Cronolito: \"Ascenso de la reina Ana al trono de Inglaterra, Escocia e Irlanda\". Los Arquitectos confirman que, efectivamente, esto pasó ANTES de que existiera el wifi."
  },
  {
    "id": 271,
    "titulo": "Fundación de la ciudad de San Petersburgo por el zar Pedro el Grande",
    "anio": 1703,
    "descripcion": "Nota del becario al margen: \"Fundación de la ciudad de San Petersburgo por el zar Pedro el Grande\". (Sigo sin encontrar el cable de la aspiradora, por cierto)."
  },
  {
    "id": 272,
    "titulo": "Tropas anglo-neerlandesas capturan el Peñón de Gibraltar en nombre del Archiduque Carlos",
    "anio": 1704,
    "descripcion": "Escaneo temporal completado: \"Tropas anglo-neerlandesas capturan el Peñón de Gibraltar en nombre del Archiduque Carlos\". Ningún dinosaurio fue visto grabando esto para TikTok. De momento."
  },
  {
    "id": 273,
    "titulo": "Publicación póstuma de los Decretos de Nueva Planta para el Reino de Valencia",
    "anio": 1705,
    "descripcion": "Fragmento recuperado del Cronolito: \"Publicación póstuma de los Decretos de Nueva Planta para el Reino de Valencia\". Coeficiente de paradoja: bajo. Se puede archivar sin pánico."
  },
  {
    "id": 274,
    "titulo": "Sitio de Turín por las tropas francesas durante la guerra de sucesión",
    "anio": 1706,
    "descripcion": "El sensor de coherencia temporal susurra: \"Sitio de Turín por las tropas francesas durante la guerra de sucesión\". Nada de esto debería sorprenderte, viajero."
  },
  {
    "id": 275,
    "titulo": "Aprobación del Acta de Unión que unifica a Inglaterra y Escocia como Gran Bretaña",
    "anio": 1707,
    "descripcion": "Bitácora de los Arquitectos del Tiempo: \"Aprobación del Acta de Unión que unifica a Inglaterra y Escocia como Gran Bretaña\". Otro ladrillo más en el muro de la Historia (con mayúscula)."
  },
  {
    "id": 276,
    "titulo": "Batalla de Oudenarde con victoria aliada sobre las tropas francesas",
    "anio": 1708,
    "descripcion": "Aviso desde el centro de control: \"Batalla de Oudenarde con victoria aliada sobre las tropas francesas\". Se ruega no tocar nada más, ya tuvimos suficiente con la aspiradora."
  },
  {
    "id": 277,
    "titulo": "Batalla de Poltava donde Pedro el Grande derrota decisivamente a los suecos",
    "anio": 1709,
    "descripcion": "Eco cronológico detectado: \"Batalla de Poltava donde Pedro el Grande derrota decisivamente a los suecos\". Verificado por triplicado — el tejido espacio-tiempo lo agradece."
  },
  {
    "id": 278,
    "titulo": "Aprobación del Estatuto de Ana en Gran Bretaña, primera ley de propiedad intelectual",
    "anio": 1710,
    "descripcion": "El Cronolito parpadea y muestra: \"Aprobación del Estatuto de Ana en Gran Bretaña, primera ley de propiedad intelectual\". Colócalo bien o la humanidad se queda sin wifi para siempre."
  },
  {
    "id": 279,
    "titulo": "El archiduque Carlos es elegido emperador del Sacro Imperio como Carlos VI",
    "anio": 1711,
    "descripcion": "Informe de campo: \"El archiduque Carlos es elegido emperador del Sacro Imperio como Carlos VI\". Ni una paradoja a la vista. Por ahora."
  },
  {
    "id": 280,
    "titulo": "Thomas Newcomen construye la primera máquina de vapor atmosférica funcional",
    "anio": 1712,
    "descripcion": "Susurro del pasado captado por los sensores: \"Thomas Newcomen construye la primera máquina de vapor atmosférica funcional\". Archívalo antes de que el café se enfríe."
  },
  {
    "id": 281,
    "titulo": "Firma del Tratado de Utrecht que reconfigura el mapa geopolítico europeo",
    "anio": 1713,
    "descripcion": "El oráculo temporal certifica: \"Firma del Tratado de Utrecht que reconfigura el mapa geopolítico europeo\". Esto sí que pasó, no como lo del becario y la aspiradora."
  },
  {
    "id": 282,
    "titulo": "Fin del Sitio de Barcelona por las tropas de Felipe V de Borbón",
    "anio": 1714,
    "descripcion": "Pieza recuperada del suelo de la sala del Cronolito: \"Fin del Sitio de Barcelona por las tropas de Felipe V de Borbón\". Un poco de polvo, pero intacta."
  },
  {
    "id": 283,
    "titulo": "Fallecimiento del rey Luis XIV de Francia tras un reinado de 72 años",
    "anio": 1715,
    "descripcion": "Consulta al archivo maestro: \"Fallecimiento del rey Luis XIV de Francia tras un reinado de 72 años\". Coincide con los registros oficiales de la Orden."
  },
  {
    "id": 284,
    "titulo": "Promulgación de los Decretos de Nueva Planta para el Principado de Cataluña",
    "anio": 1716,
    "descripcion": "Alerta de baja prioridad: \"Promulgación de los Decretos de Nueva Planta para el Principado de Cataluña\". Ni rastro de paradojas ni de becarios torpes en las cercanías."
  },
  {
    "id": 285,
    "titulo": "Creación del Virreinato de Nueva Granada por orden del rey Felipe V",
    "anio": 1717,
    "descripcion": "Registro del Cronolito: \"Creación del Virreinato de Nueva Granada por orden del rey Felipe V\". Los Arquitectos confirman que, efectivamente, esto pasó ANTES de que existiera el wifi."
  },
  {
    "id": 286,
    "titulo": "Fundación de la ciudad de Nueva Orleans por colonos franceses en Luisiana",
    "anio": 1718,
    "descripcion": "Nota del becario al margen: \"Fundación de la ciudad de Nueva Orleans por colonos franceses en Luisiana\". (Sigo sin encontrar el cable de la aspiradora, por cierto)."
  },
  {
    "id": 287,
    "titulo": "Estallido de la Guerra de la Cuádruple Alianza contra la política exterior española",
    "anio": 1719,
    "descripcion": "Escaneo temporal completado: \"Estallido de la Guerra de la Cuádruple Alianza contra la política exterior española\". Ningún dinosaurio fue visto grabando esto para TikTok. De momento."
  },
  {
    "id": 288,
    "titulo": "Estallido de la burbuja financiera de la Compañía del Mar del Sur en Londres",
    "anio": 1720,
    "descripcion": "Fragmento recuperado del Cronolito: \"Estallido de la burbuja financiera de la Compañía del Mar del Sur en Londres\". Coeficiente de paradoja: bajo. Se puede archivar sin pánico."
  },
  {
    "id": 289,
    "titulo": "Robert Walpole es nombrado como el primer primer ministro de Gran Bretaña",
    "anio": 1721,
    "descripcion": "El sensor de coherencia temporal susurra: \"Robert Walpole es nombrado como el primer primer ministro de Gran Bretaña\". Nada de esto debería sorprenderte, viajero."
  },
  {
    "id": 290,
    "titulo": "El explorador Jakob Roggeveen descubre la Isla de Pascua el día de resurrección",
    "anio": 1722,
    "descripcion": "Bitácora de los Arquitectos del Tiempo: \"El explorador Jakob Roggeveen descubre la Isla de Pascua el día de resurrección\". Otro ladrillo más en el muro de la Historia (con mayúscula)."
  },
  {
    "id": 291,
    "titulo": "Fallecimiento del arquitecto Christopher Wren, reconstructor de Londres",
    "anio": 1723,
    "descripcion": "Aviso desde el centro de control: \"Fallecimiento del arquitecto Christopher Wren, reconstructor de Londres\". Se ruega no tocar nada más, ya tuvimos suficiente con la aspiradora."
  },
  {
    "id": 292,
    "titulo": "Abdicación efímera de Felipe V en favor de su hijo Luis I de España",
    "anio": 1724,
    "descripcion": "Eco cronológico detectado: \"Abdicación efímera de Felipe V en favor de su hijo Luis I de España\". Verificado por triplicado — el tejido espacio-tiempo lo agradece."
  },
  {
    "id": 293,
    "titulo": "Firma del Tratado de Viena entre España y el Sacro Imperio Romano Germánico",
    "anio": 1725,
    "descripcion": "El Cronolito parpadea y muestra: \"Firma del Tratado de Viena entre España y el Sacro Imperio Romano Germánico\". Colócalo bien o la humanidad se queda sin wifi para siempre."
  },
  {
    "id": 294,
    "titulo": "Publicación de Los viajes de Gulliver de la autoría de Jonathan Swift",
    "anio": 1726,
    "descripcion": "Informe de campo: \"Publicación de Los viajes de Gulliver de la autoría de Jonathan Swift\". Ni una paradoja a la vista. Por ahora."
  },
  {
    "id": 295,
    "titulo": "Fallecimiento del físico y matemático inglés Isaac Newton en Londres",
    "anio": 1727,
    "descripcion": "Susurro del pasado captado por los sensores: \"Fallecimiento del físico y matemático inglés Isaac Newton en Londres\". Archívalo antes de que el café se enfríe."
  },
  {
    "id": 296,
    "titulo": "El explorador Vitus Bering navega por primera vez a través del estrecho que lleva su nombre",
    "anio": 1728,
    "descripcion": "El oráculo temporal certifica: \"El explorador Vitus Bering navega por primera vez a través del estrecho que lleva su nombre\". Esto sí que pasó, no como lo del becario y la aspiradora."
  },
  {
    "id": 297,
    "titulo": "Firma del Tratado de Sevilla entre España, Francia y Gran Bretaña",
    "anio": 1729,
    "descripcion": "Pieza recuperada del suelo de la sala del Cronolito: \"Firma del Tratado de Sevilla entre España, Francia y Gran Bretaña\". Un poco de polvo, pero intacta."
  },
  {
    "id": 298,
    "titulo": "Inicio del papado de Clemente XII tras un cónclave de cuatro meses",
    "anio": 1730,
    "descripcion": "Consulta al archivo maestro: \"Inicio del papado de Clemente XII tras un cónclave de cuatro meses\". Coincide con los registros oficiales de la Orden."
  },
  {
    "id": 299,
    "titulo": "Firma del segundo Tratado de Viena que ratifica la sucesión en los ducados italianos",
    "anio": 1731,
    "descripcion": "Alerta de baja prioridad: \"Firma del segundo Tratado de Viena que ratifica la sucesión en los ducados italianos\". Ni rastro de paradojas ni de becarios torpes en las cercanías."
  },
  {
    "id": 300,
    "titulo": "Nacimiento de George Washington en la colonia británica de Virginia",
    "anio": 1732,
    "descripcion": "Registro del Cronolito: \"Nacimiento de George Washington en la colonia británica de Virginia\". Los Arquitectos confirman que, efectivamente, esto pasó ANTES de que existiera el wifi."
  },
  {
    "id": 301,
    "titulo": "Firma del Primer Pacto de Familia entre las coronas de España y Francia",
    "anio": 1733,
    "descripcion": "Nota del becario al margen: \"Firma del Primer Pacto de Familia entre las coronas de España y Francia\". (Sigo sin encontrar el cable de la aspiradora, por cierto)."
  },
  {
    "id": 302,
    "titulo": "Batalla de Bitonto que consolida el dominio borbónico sobre Nápoles y Sicilia",
    "anio": 1734,
    "descripcion": "Escaneo temporal completado: \"Batalla de Bitonto que consolida el dominio borbónico sobre Nápoles y Sicilia\". Ningún dinosaurio fue visto grabando esto para TikTok. De momento."
  },
  {
    "id": 303,
    "titulo": "Linneo publica la primera edición de su obra científica Systema Naturae",
    "anio": 1735,
    "descripcion": "Fragmento recuperado del Cronolito: \"Linneo publica la primera edición de su obra científica Systema Naturae\". Coeficiente de paradoja: bajo. Se puede archivar sin pánico."
  },
  {
    "id": 304,
    "titulo": "Nader Shah es coronado emperador fundando la dinastía Afshárida en Persia",
    "anio": 1736,
    "descripcion": "El sensor de coherencia temporal susurra: \"Nader Shah es coronado emperador fundando la dinastía Afshárida en Persia\". Nada de esto debería sorprenderte, viajero."
  },
  {
    "id": 305,
    "titulo": "Extinción de la dinastía Médici en el Gran Ducado de Toscana",
    "anio": 1737,
    "descripcion": "Bitácora de los Arquitectos del Tiempo: \"Extinción de la dinastía Médici en el Gran Ducado de Toscana\". Otro ladrillo más en el muro de la Historia (con mayúscula)."
  },
  {
    "id": 306,
    "titulo": "Firma del Tratado de Viena que pone fin a la Guerra de Sucesión Polaca",
    "anio": 1738,
    "descripcion": "Aviso desde el centro de control: \"Firma del Tratado de Viena que pone fin a la Guerra de Sucesión Polaca\". Se ruega no tocar nada más, ya tuvimos suficiente con la aspiradora."
  },
  {
    "id": 307,
    "titulo": "Estallido de la Guerra del Asiento o de la Oreja de Jenkins entre España e Inglaterra",
    "anio": 1739,
    "descripcion": "Eco cronológico detectado: \"Estallido de la Guerra del Asiento o de la Oreja de Jenkins entre España e Inglaterra\". Verificado por triplicado — el tejido espacio-tiempo lo agradece."
  },
  {
    "id": 308,
    "titulo": "Estallido de la Guerra de Sucesión Austriaca tras la muerte de Carlos VI",
    "anio": 1740,
    "descripcion": "El Cronolito parpadea y muestra: \"Estallido de la Guerra de Sucesión Austriaca tras la muerte de Carlos VI\". Colócalo bien o la humanidad se queda sin wifi para siempre."
  },
  {
    "id": 309,
    "titulo": "Fracaso del ataque británico liderado por Vernon contra Cartagena de Indias",
    "anio": 1741,
    "descripcion": "Informe de campo: \"Fracaso del ataque británico liderado por Vernon contra Cartagena de Indias\". Ni una paradoja a la vista. Por ahora."
  },
  {
    "id": 310,
    "titulo": "Estreno oficial en Dublín del oratorio El Mesías del compositor Händel",
    "anio": 1742,
    "descripcion": "Susurro del pasado captado por los sensores: \"Estreno oficial en Dublín del oratorio El Mesías del compositor Händel\". Archívalo antes de que el café se enfríe."
  },
  {
    "id": 311,
    "titulo": "Firma del Segundo Pacto de Familia entre España y Francia en Fontainebleau",
    "anio": 1743,
    "descripcion": "El oráculo temporal certifica: \"Firma del Segundo Pacto de Familia entre España y Francia en Fontainebleau\". Esto sí que pasó, no como lo del becario y la aspiradora."
  },
  {
    "id": 312,
    "titulo": "Estallido de la primera guerra carnática en la India entre franceses y británicos",
    "anio": 1744,
    "descripcion": "Pieza recuperada del suelo de la sala del Cronolito: \"Estallido de la primera guerra carnática en la India entre franceses y británicos\". Un poco de polvo, pero intacta."
  },
  {
    "id": 313,
    "titulo": "Batalla de Fontenoy durante la Guerra de Sucesión Austriaca",
    "anio": 1745,
    "descripcion": "Consulta al archivo maestro: \"Batalla de Fontenoy durante la Guerra de Sucesión Austriaca\". Coincide con los registros oficiales de la Orden."
  },
  {
    "id": 314,
    "titulo": "Batalla de Culloden que pone fin definitivo a las revueltas jacobitas en Escocia",
    "anio": 1746,
    "descripcion": "Alerta de baja prioridad: \"Batalla de Culloden que pone fin definitivo a las revueltas jacobitas en Escocia\". Ni rastro de paradojas ni de becarios torpes en las cercanías."
  },
  {
    "id": 315,
    "titulo": "Asesinato de Nader Shah provocando la fragmentación de su imperio persa",
    "anio": 1747,
    "descripcion": "Registro del Cronolito: \"Asesinato de Nader Shah provocando la fragmentación de su imperio persa\". Los Arquitectos confirman que, efectivamente, esto pasó ANTES de que existiera el wifi."
  },
  {
    "id": 316,
    "titulo": "Firma del Tratado de Aquisgrán que pone fin a la Guerra de Sucesión Austriaca",
    "anio": 1748,
    "descripcion": "Nota del becario al margen: \"Firma del Tratado de Aquisgrán que pone fin a la Guerra de Sucesión Austriaca\". (Sigo sin encontrar el cable de la aspiradora, por cierto)."
  },
  {
    "id": 317,
    "titulo": "Gran Redada autorizada por Fernando VI para arrestar a todos los gitanos de España",
    "anio": 1749,
    "descripcion": "Escaneo temporal completado: \"Gran Redada autorizada por Fernando VI para arrestar a todos los gitanos de España\". Ningún dinosaurio fue visto grabando esto para TikTok. De momento."
  },
  {
    "id": 318,
    "titulo": "Firma del Tratado de Madrid que fija las fronteras americanas entre España y Portugal",
    "anio": 1750,
    "descripcion": "Fragmento recuperado del Cronolito: \"Firma del Tratado de Madrid que fija las fronteras americanas entre España y Portugal\". Coeficiente de paradoja: bajo. Se puede archivar sin pánico."
  },
  {
    "id": 319,
    "titulo": "Publicación del primer volumen de la Enciclopedia de Diderot y d'Alembert",
    "anio": 1751,
    "descripcion": "El sensor de coherencia temporal susurra: \"Publicación del primer volumen de la Enciclopedia de Diderot y d'Alembert\". Nada de esto debería sorprenderte, viajero."
  },
  {
    "id": 320,
    "titulo": "Benjamin Franklin realiza su célebre experimento con la cometa y el pararrayos",
    "anio": 1752,
    "descripcion": "Bitácora de los Arquitectos del Tiempo: \"Benjamin Franklin realiza su célebre experimento con la cometa y el pararrayos\". Otro ladrillo más en el muro de la Historia (con mayúscula)."
  },
  {
    "id": 321,
    "titulo": "Fundación del Museo Británico en Londres a partir de la colección de Hans Sloane",
    "anio": 1753,
    "descripcion": "Aviso desde el centro de control: \"Fundación del Museo Británico en Londres a partir de la colección de Hans Sloane\". Se ruega no tocar nada más, ya tuvimos suficiente con la aspiradora."
  },
  {
    "id": 322,
    "titulo": "Inicio de la Guerra Franco-Indígena en el territorio de Norteamérica",
    "anio": 1754,
    "descripcion": "Eco cronológico detectado: \"Inicio de la Guerra Franco-Indígena en el territorio de Norteamérica\". Verificado por triplicado — el tejido espacio-tiempo lo agradece."
  },
  {
    "id": 323,
    "titulo": "Terremoto, tsunami e incendios destruyen casi por completo la ciudad de Lisboa",
    "anio": 1755,
    "descripcion": "El Cronolito parpadea y muestra: \"Terremoto, tsunami e incendios destruyen casi por completo la ciudad de Lisboa\". Colócalo bien o la humanidad se queda sin wifi para siempre."
  },
  {
    "id": 324,
    "titulo": "Inicio formal de la Guerra de los Siete Años en el continente europeo",
    "anio": 1756,
    "descripcion": "Informe de campo: \"Inicio formal de la Guerra de los Siete Años en el continente europeo\". Ni una paradoja a la vista. Por ahora."
  },
  {
    "id": 325,
    "titulo": "Batalla de Plassey que inicia el dominio británico sobre Bengala e India",
    "anio": 1757,
    "descripcion": "Susurro del pasado captado por los sensores: \"Batalla de Plassey que inicia el dominio británico sobre Bengala e India\". Archívalo antes de que el café se enfríe."
  },
  {
    "id": 326,
    "titulo": "Batalla de Zorndorf entre las tropas de Prusia y el Imperio Ruso",
    "anio": 1758,
    "descripcion": "El oráculo temporal certifica: \"Batalla de Zorndorf entre las tropas de Prusia y el Imperio Ruso\". Esto sí que pasó, no como lo del becario y la aspiradora."
  },
  {
    "id": 327,
    "titulo": "Carlos III asciende al trono de España tras la muerte de su hermano Fernando VI",
    "anio": 1759,
    "descripcion": "Pieza recuperada del suelo de la sala del Cronolito: \"Carlos III asciende al trono de España tras la muerte de su hermano Fernando VI\". Un poco de polvo, pero intacta."
  },
  {
    "id": 328,
    "titulo": "Coronación de Jorge III como rey de Gran Bretaña e Irlanda",
    "anio": 1760,
    "descripcion": "Consulta al archivo maestro: \"Coronación de Jorge III como rey de Gran Bretaña e Irlanda\". Coincide con los registros oficiales de la Orden."
  },
  {
    "id": 329,
    "titulo": "Firma del Tercer Pacto de Familia entre los Borbones de España y Francia",
    "anio": 1761,
    "descripcion": "Alerta de baja prioridad: \"Firma del Tercer Pacto de Familia entre los Borbones de España y Francia\". Ni rastro de paradojas ni de becarios torpes en las cercanías."
  },
  {
    "id": 330,
    "titulo": "Catalina la Grande asciende al trono imperial de Rusia tras un golpe de Estado",
    "anio": 1762,
    "descripcion": "Registro del Cronolito: \"Catalina la Grande asciende al trono imperial de Rusia tras un golpe de Estado\". Los Arquitectos confirman que, efectivamente, esto pasó ANTES de que existiera el wifi."
  },
  {
    "id": 331,
    "titulo": "Firma del Tratado de París que pone fin a la Guerra de los Siete Años",
    "anio": 1763,
    "descripcion": "Nota del becario al margen: \"Firma del Tratado de París que pone fin a la Guerra de los Siete Años\". (Sigo sin encontrar el cable de la aspiradora, por cierto)."
  },
  {
    "id": 332,
    "titulo": "Publicación de la obra Tratado de los delitos y de las penas de Cesare Beccaria",
    "anio": 1764,
    "descripcion": "Escaneo temporal completado: \"Publicación de la obra Tratado de los delitos y de las penas de Cesare Beccaria\". Ningún dinosaurio fue visto grabando esto para TikTok. De momento."
  },
  {
    "id": 333,
    "titulo": "El Parlamento británico aprueba la Ley del Timbre provocando protestas coloniales",
    "anio": 1765,
    "descripcion": "Fragmento recuperado del Cronolito: \"El Parlamento británico aprueba la Ley del Timbre provocando protestas coloniales\". Coeficiente de paradoja: bajo. Se puede archivar sin pánico."
  },
  {
    "id": 334,
    "titulo": "Estallido del Motín de Esquilache en Madrid contra las reformas de vestimenta",
    "anio": 1766,
    "descripcion": "El sensor de coherencia temporal susurra: \"Estallido del Motín de Esquilache en Madrid contra las reformas de vestimenta\". Nada de esto debería sorprenderte, viajero."
  },
  {
    "id": 335,
    "titulo": "Expulsión de la Compañía de Jesús de todos los territorios de la Monarquía Hispánica",
    "anio": 1767,
    "descripcion": "Bitácora de los Arquitectos del Tiempo: \"Expulsión de la Compañía de Jesús de todos los territorios de la Monarquía Hispánica\". Otro ladrillo más en el muro de la Historia (con mayúscula)."
  },
  {
    "id": 336,
    "titulo": "Francia compra los derechos de la isla de Córcega a la República de Génova",
    "anio": 1768,
    "descripcion": "Aviso desde el centro de control: \"Francia compra los derechos de la isla de Córcega a la República de Génova\". Se ruega no tocar nada más, ya tuvimos suficiente con la aspiradora."
  },
  {
    "id": 337,
    "titulo": "James Watt patenta la máquina de vapor moderna con condensador separado",
    "anio": 1769,
    "descripcion": "Eco cronológico detectado: \"James Watt patenta la máquina de vapor moderna con condensador separado\". Verificado por triplicado — el tejido espacio-tiempo lo agradece."
  },
  {
    "id": 338,
    "titulo": "La Masacre de Boston eleva la tensión entre los colonos y las tropas británicas",
    "anio": 1770,
    "descripcion": "El Cronolito parpadea y muestra: \"La Masacre de Boston eleva la tensión entre los colonos y las tropas británicas\". Colócalo bien o la humanidad se queda sin wifi para siempre."
  },
  {
    "id": 339,
    "titulo": "Viaje del explorador James Cook completando su primera circunnavegación",
    "anio": 1771,
    "descripcion": "Informe de campo: \"Viaje del explorador James Cook completando su primera circunnavegación\". Ni una paradoja a la vista. Por ahora."
  },
  {
    "id": 340,
    "titulo": "Primera partición de Polonia entre Prusia, Austria y el Imperio Ruso",
    "anio": 1772,
    "descripcion": "Susurro del pasado captado por los sensores: \"Primera partición de Polonia entre Prusia, Austria y el Imperio Ruso\". Archívalo antes de que el café se enfríe."
  },
  {
    "id": 341,
    "titulo": "El Motín del Té en Boston inicia la escalada armada revolucionaria norteamericana",
    "anio": 1773,
    "descripcion": "El oráculo temporal certifica: \"El Motín del Té en Boston inicia la escalada armada revolucionaria norteamericana\". Esto sí que pasó, no como lo del becario y la aspiradora."
  },
  {
    "id": 342,
    "titulo": "Inauguración del Primer Congreso Continental de las colonias americanas en Filadelfia",
    "anio": 1774,
    "descripcion": "Pieza recuperada del suelo de la sala del Cronolito: \"Inauguración del Primer Congreso Continental de las colonias americanas en Filadelfia\". Un poco de polvo, pero intacta."
  },
  {
    "id": 343,
    "titulo": "Batallas de Lexington y Concord marcan el inicio de la Guerra de Independencia de EE.UU.",
    "anio": 1775,
    "descripcion": "Consulta al archivo maestro: \"Batallas de Lexington y Concord marcan el inicio de la Guerra de Independencia de EE.UU.\". Coincide con los registros oficiales de la Orden."
  },
  {
    "id": 344,
    "titulo": "Declaración de Independencia de los Estados Unidos de América en Filadelfia",
    "anio": 1776,
    "descripcion": "Alerta de baja prioridad: \"Declaración de Independencia de los Estados Unidos de América en Filadelfia\". Ni rastro de paradojas ni de becarios torpes en las cercanías."
  },
  {
    "id": 345,
    "titulo": "Batalla de Saratoga, victoria colonial que propicia el apoyo francés a la revolución",
    "anio": 1777,
    "descripcion": "Registro del Cronolito: \"Batalla de Saratoga, victoria colonial que propicia el apoyo francés a la revolución\". Los Arquitectos confirman que, efectivamente, esto pasó ANTES de que existiera el wifi."
  },
  {
    "id": 346,
    "titulo": "Francia firma un tratado de alianza con EE.UU. y entra en guerra con Gran Bretaña",
    "anio": 1778,
    "descripcion": "Nota del becario al margen: \"Francia firma un tratado de alianza con EE.UU. y entra en guerra con Gran Bretaña\". (Sigo sin encontrar el cable de la aspiradora, por cierto)."
  },
  {
    "id": 347,
    "titulo": "España entra en la Guerra de Independencia de EE.UU. y asedia Gibraltar",
    "anio": 1779,
    "descripcion": "Escaneo temporal completado: \"España entra en la Guerra de Independencia de EE.UU. y asedia Gibraltar\". Ningún dinosaurio fue visto grabando esto para TikTok. De momento."
  },
  {
    "id": 348,
    "titulo": "Estallido de la rebelión indígena liderada por Túpac Amaru II en el Virreinato del Perú",
    "anio": 1780,
    "descripcion": "Fragmento recuperado del Cronolito: \"Estallido de la rebelión indígena liderada por Túpac Amaru II en el Virreinato del Perú\". Coeficiente de paradoja: bajo. Se puede archivar sin pánico."
  },
  {
    "id": 349,
    "titulo": "Rendición británica en el Sitio de Yorktown ante las tropas americanas y francesas",
    "anio": 1781,
    "descripcion": "El sensor de coherencia temporal susurra: \"Rendición británica en el Sitio de Yorktown ante las tropas americanas y francesas\". Nada de esto debería sorprenderte, viajero."
  },
  {
    "id": 350,
    "titulo": "El virrey de Nueva Granada concede el indulto definitivo a los cabecillas Comuneros",
    "anio": 1782,
    "descripcion": "Bitácora de los Arquitectos del Tiempo: \"El virrey de Nueva Granada concede el indulto definitivo a los cabecillas Comuneros\". Otro ladrillo más en el muro de la Historia (con mayúscula)."
  },
  {
    "id": 351,
    "titulo": "Firma del Tratado de París por el que Gran Bretaña reconoce la independencia de EE.UU.",
    "anio": 1783,
    "descripcion": "Aviso desde el centro de control: \"Firma del Tratado de París por el que Gran Bretaña reconoce la independencia de EE.UU.\". Se ruega no tocar nada más, ya tuvimos suficiente con la aspiradora."
  },
  {
    "id": 352,
    "titulo": "Firma del Tratado de Constantinopla que formaliza la anexión rusa de Crimea",
    "anio": 1784,
    "descripcion": "Eco cronológico detectado: \"Firma del Tratado de Constantinopla que formaliza la anexión rusa de Crimea\". Verificado por triplicado — el tejido espacio-tiempo lo agradece."
  },
  {
    "id": 353,
    "titulo": "Creación formal del Archivo General de Indias en Sevilla por orden de Carlos III",
    "anio": 1785,
    "descripcion": "El Cronolito parpadea y muestra: \"Creación formal del Archivo General de Indias en Sevilla por orden de Carlos III\". Colócalo bien o la humanidad se queda sin wifi para siempre."
  },
  {
    "id": 354,
    "titulo": "Fallecimiento del rey Federico II el Grande de Prusia en Potsdam",
    "anio": 1786,
    "descripcion": "Informe de campo: \"Fallecimiento del rey Federico II el Grande de Prusia en Potsdam\". Ni una paradoja a la vista. Por ahora."
  },
  {
    "id": 355,
    "titulo": "Firma de la Constitución de los Estados Unidos en la Convención de Filadelfia",
    "anio": 1787,
    "descripcion": "Susurro del pasado captado por los sensores: \"Firma de la Constitución de los Estados Unidos en la Convención de Filadelfia\". Archívalo antes de que el café se enfríe."
  },
  {
    "id": 356,
    "titulo": "Llegada de la Primera Flota británica a Australia fundando la colonia de Sídney",
    "anio": 1788,
    "descripcion": "El oráculo temporal certifica: \"Llegada de la Primera Flota británica a Australia fundando la colonia de Sídney\". Esto sí que pasó, no como lo del becario y la aspiradora."
  },
  {
    "id": 357,
    "titulo": "Toma de la Bastilla en París dando inicio formal a la Revolución Francesa",
    "anio": 1789,
    "descripcion": "Pieza recuperada del suelo de la sala del Cronolito: \"Toma de la Bastilla en París dando inicio formal a la Revolución Francesa\". Un poco de polvo, pero intacta."
  },
  {
    "id": 358,
    "titulo": "Proclamación de la Constitución Civil del Clero por la Asamblea Nacional francesa",
    "anio": 1790,
    "descripcion": "Consulta al archivo maestro: \"Proclamación de la Constitución Civil del Clero por la Asamblea Nacional francesa\". Coincide con los registros oficiales de la Orden."
  },
  {
    "id": 359,
    "titulo": "Estallido de la Revolución de Haití, rebelión de esclavos contra el dominio francés",
    "anio": 1791,
    "descripcion": "Alerta de baja prioridad: \"Estallido de la Revolución de Haití, rebelión de esclavos contra el dominio francés\". Ni rastro de paradojas ni de becarios torpes en las cercanías."
  },
  {
    "id": 360,
    "titulo": "Asalto al Palacio de las Tullerías y proclamación de la Primera República Francesa",
    "anio": 1792,
    "descripcion": "Registro del Cronolito: \"Asalto al Palacio de las Tullerías y proclamación de la Primera República Francesa\". Los Arquitectos confirman que, efectivamente, esto pasó ANTES de que existiera el wifi."
  },
  {
    "id": 361,
    "titulo": "Ejecución en la guillotina del rey Luis XVI de Francia en la plaza de la Revolución",
    "anio": 1793,
    "descripcion": "Nota del becario al margen: \"Ejecución en la guillotina del rey Luis XVI de Francia en la plaza de la Revolución\". (Sigo sin encontrar el cable de la aspiradora, por cierto)."
  },
  {
    "id": 362,
    "titulo": "Caída y ejecución de Robespierre poniendo fin al periodo del Terror jacobino",
    "anio": 1794,
    "descripcion": "Escaneo temporal completado: \"Caída y ejecución de Robespierre poniendo fin al periodo del Terror jacobino\". Ningún dinosaurio fue visto grabando esto para TikTok. De momento."
  },
  {
    "id": 363,
    "titulo": "Tercera partición de Polonia que borra al país del mapa político de Europa",
    "anio": 1795,
    "descripcion": "Fragmento recuperado del Cronolito: \"Tercera partición de Polonia que borra al país del mapa político de Europa\". Coeficiente de paradoja: bajo. Se puede archivar sin pánico."
  },
  {
    "id": 364,
    "titulo": "Napoleón Bonaparte asume el mando del ejército de Italia logrando grandes victorias",
    "anio": 1796,
    "descripcion": "El sensor de coherencia temporal susurra: \"Napoleón Bonaparte asume el mando del ejército de Italia logrando grandes victorias\". Nada de esto debería sorprenderte, viajero."
  },
  {
    "id": 365,
    "titulo": "Firma del Tratado de Campo Formio que disuelve la República de Venecia",
    "anio": 1797,
    "descripcion": "Bitácora de los Arquitectos del Tiempo: \"Firma del Tratado de Campo Formio que disuelve la República de Venecia\". Otro ladrillo más en el muro de la Historia (con mayúscula)."
  },
  {
    "id": 366,
    "titulo": "Expedición militar y científica de Napoleón Bonaparte a Egipto",
    "anio": 1798,
    "descripcion": "Aviso desde el centro de control: \"Expedición militar y científica de Napoleón Bonaparte a Egipto\". Se ruega no tocar nada más, ya tuvimos suficiente con la aspiradora."
  },
  {
    "id": 367,
    "titulo": "Golpe de Estado del 18 de brumario de Napoleón instalando el Consulado en Francia",
    "anio": 1799,
    "descripcion": "Eco cronológico detectado: \"Golpe de Estado del 18 de brumario de Napoleón instalando el Consulado en Francia\". Verificado por triplicado — el tejido espacio-tiempo lo agradece."
  },
  {
    "id": 368,
    "titulo": "Firma del Tratado secreto de San Ildefonso por el que España devuelve Luisiana a Francia",
    "anio": 1800,
    "descripcion": "El Cronolito parpadea y muestra: \"Firma del Tratado secreto de San Ildefonso por el que España devuelve Luisiana a Francia\". Colócalo bien o la humanidad se queda sin wifi para siempre."
  },
  {
    "id": 369,
    "titulo": "Aprobación del Acta de Unión que crea el Reino Unido de Gran Bretaña e Irlanda",
    "anio": 1801,
    "descripcion": "Informe de campo: \"Aprobación del Acta de Unión que crea el Reino Unido de Gran Bretaña e Irlanda\". Ni una paradoja a la vista. Por ahora."
  },
  {
    "id": 370,
    "titulo": "Firma de la Paz de Amiens que interrumpe temporalmente las guerras napoleónicas",
    "anio": 1802,
    "descripcion": "Susurro del pasado captado por los sensores: \"Firma de la Paz de Amiens que interrumpe temporalmente las guerras napoleónicas\". Archívalo antes de que el café se enfríe."
  },
  {
    "id": 371,
    "titulo": "Estados Unidos compra formalmente el territorio colonizado de Luisiana a Francia",
    "anio": 1803,
    "descripcion": "El oráculo temporal certifica: \"Estados Unidos compra formalmente el territorio colonizado de Luisiana a Francia\". Esto sí que pasó, no como lo del becario y la aspiradora."
  },
  {
    "id": 372,
    "titulo": "Napoleón Bonaparte se corona Emperador de los franceses en Notre Dame",
    "anio": 1804,
    "descripcion": "Pieza recuperada del suelo de la sala del Cronolito: \"Napoleón Bonaparte se corona Emperador de los franceses en Notre Dame\". Un poco de polvo, pero intacta."
  },
  {
    "id": 373,
    "titulo": "Batalla de Trafalgar donde la armada británica destruye la flota franco-española",
    "anio": 1805,
    "descripcion": "Consulta al archivo maestro: \"Batalla de Trafalgar donde la armada británica destruye la flota franco-española\". Coincide con los registros oficiales de la Orden."
  },
  {
    "id": 374,
    "titulo": "Disolución formal del Sacro Imperio Romano Germánico por el emperador Francisco II",
    "anio": 1806,
    "descripcion": "Alerta de baja prioridad: \"Disolución formal del Sacro Imperio Romano Germánico por el emperador Francisco II\". Ni rastro de paradojas ni de becarios torpes en las cercanías."
  },
  {
    "id": 375,
    "titulo": "Invasión de las tropas francesas a Portugal provocando la huida de la corte a Brasil",
    "anio": 1807,
    "descripcion": "Registro del Cronolito: \"Invasión de las tropas francesas a Portugal provocando la huida de la corte a Brasil\". Los Arquitectos confirman que, efectivamente, esto pasó ANTES de que existiera el wifi."
  },
  {
    "id": 376,
    "titulo": "Levantamiento del 2 de mayo en Madrid contra la ocupación francesa",
    "anio": 1808,
    "descripcion": "Nota del becario al margen: \"Levantamiento del 2 de mayo en Madrid contra la ocupación francesa\". (Sigo sin encontrar el cable de la aspiradora, por cierto)."
  },
  {
    "id": 377,
    "titulo": "Proclamación de las primeras juntas de gobierno autónomas en Chuquisaca y Quito",
    "anio": 1809,
    "descripcion": "Escaneo temporal completado: \"Proclamación de las primeras juntas de gobierno autónomas en Chuquisaca y Quito\". Ningún dinosaurio fue visto grabando esto para TikTok. De momento."
  },
  {
    "id": 378,
    "titulo": "Inicio de la Guerra de Independencia de México con el Grito de Dolores de Hidalgo",
    "anio": 1810,
    "descripcion": "Fragmento recuperado del Cronolito: \"Inicio de la Guerra de Independencia de México con el Grito de Dolores de Hidalgo\". Coeficiente de paradoja: bajo. Se puede archivar sin pánico."
  },
  {
    "id": 379,
    "titulo": "Proclamación de la independencia del Congreso de Venezuela en Caracas",
    "anio": 1811,
    "descripcion": "El sensor de coherencia temporal susurra: \"Proclamación de la independencia del Congreso de Venezuela en Caracas\". Nada de esto debería sorprenderte, viajero."
  },
  {
    "id": 380,
    "titulo": "Promulgación de la primera Constitución española conocida popularmente como La Pepa",
    "anio": 1812,
    "descripcion": "Bitácora de los Arquitectos del Tiempo: \"Promulgación de la primera Constitución española conocida popularmente como La Pepa\". Otro ladrillo más en el muro de la Historia (con mayúscula)."
  },
  {
    "id": 381,
    "titulo": "Batalla de Leipzig donde la coalición aliada inflige una gran derrota a Napoleón",
    "anio": 1813,
    "descripcion": "Aviso desde el centro de control: \"Batalla de Leipzig donde la coalición aliada inflige una gran derrota a Napoleón\". Se ruega no tocar nada más, ya tuvimos suficiente con la aspiradora."
  },
  {
    "id": 382,
    "titulo": "Abdicación de Napoleón y restauración de la dinastía de los Borbones en Francia",
    "anio": 1814,
    "descripcion": "Eco cronológico detectado: \"Abdicación de Napoleón y restauración de la dinastía de los Borbones en Francia\". Verificado por triplicado — el tejido espacio-tiempo lo agradece."
  },
  {
    "id": 383,
    "titulo": "Derrota definitiva de Napoleón Bonaparte en la Batalla de Waterloo",
    "anio": 1815,
    "descripcion": "El Cronolito parpadea y muestra: \"Derrota definitiva de Napoleón Bonaparte en la Batalla de Waterloo\". Colócalo bien o la humanidad se queda sin wifi para siempre."
  },
  {
    "id": 384,
    "titulo": "Declaración de Independencia de las Provincias Unidas en Sudamérica en el Congreso de Tucumán",
    "anio": 1816,
    "descripcion": "Informe de campo: \"Declaración de Independencia de las Provincias Unidas en Sudamérica en el Congreso de Tucumán\". Ni una paradoja a la vista. Por ahora."
  },
  {
    "id": 385,
    "titulo": "José de San Martín cruza la cordillera de los Andes con su ejército libertador",
    "anio": 1817,
    "descripcion": "Susurro del pasado captado por los sensores: \"José de San Martín cruza la cordillera de los Andes con su ejército libertador\". Archívalo antes de que el café se enfríe."
  },
  {
    "id": 386,
    "titulo": "Declaración de la Independencia de Chile firmada por Bernardo O'Higgins",
    "anio": 1818,
    "descripcion": "El oráculo temporal certifica: \"Declaración de la Independencia de Chile firmada por Bernardo O'Higgins\". Esto sí que pasó, no como lo del becario y la aspiradora."
  },
  {
    "id": 387,
    "titulo": "Simón Bolívar vence en la Batalla de Boyacá consolidando la liberación de Nueva Granada",
    "anio": 1819,
    "descripcion": "Pieza recuperada del suelo de la sala del Cronolito: \"Simón Bolívar vence en la Batalla de Boyacá consolidando la liberación de Nueva Granada\". Un poco de polvo, pero intacta."
  },
  {
    "id": 388,
    "titulo": "Pronunciamiento de Rafael del Riego en Las Cabezas de San Juan iniciando el Trienio Liberal",
    "anio": 1820,
    "descripcion": "Consulta al archivo maestro: \"Pronunciamiento de Rafael del Riego en Las Cabezas de San Juan iniciando el Trienio Liberal\". Coincide con los registros oficiales de la Orden."
  },
  {
    "id": 389,
    "titulo": "Entrada del Ejército Trigarante a Ciudad de México consumando la independencia",
    "anio": 1821,
    "descripcion": "Alerta de baja prioridad: \"Entrada del Ejército Trigarante a Ciudad de México consumando la independencia\". Ni rastro de paradojas ni de becarios torpes en las cercanías."
  },
  {
    "id": 390,
    "titulo": "Grito de Ipiranga por el príncipe Pedro proclamando la independencia del Imperio de Brasil",
    "anio": 1822,
    "descripcion": "Registro del Cronolito: \"Grito de Ipiranga por el príncipe Pedro proclamando la independencia del Imperio de Brasil\". Los Arquitectos confirman que, efectivamente, esto pasó ANTES de que existiera el wifi."
  },
  {
    "id": 391,
    "titulo": "Los Cien Mil Hijos de San Luis invaden España restaurando el absolutismo de Fernando VII",
    "anio": 1823,
    "descripcion": "Nota del becario al margen: \"Los Cien Mil Hijos de San Luis invaden España restaurando el absolutismo de Fernando VII\". (Sigo sin encontrar el cable de la aspiradora, por cierto)."
  },
  {
    "id": 392,
    "titulo": "Batalla de Ayacucho que sella de forma definitiva la independencia de la América del Sur",
    "anio": 1824,
    "descripcion": "Escaneo temporal completado: \"Batalla de Ayacucho que sella de forma definitiva la independencia de la América del Sur\". Ningún dinosaurio fue visto grabando esto para TikTok. De momento."
  },
  {
    "id": 393,
    "titulo": "Inauguración de la línea ferroviaria Stockton-Darlington en Inglaterra, primera de uso público",
    "anio": 1825,
    "descripcion": "Fragmento recuperado del Cronolito: \"Inauguración de la línea ferroviaria Stockton-Darlington en Inglaterra, primera de uso público\". Coeficiente de paradoja: bajo. Se puede archivar sin pánico."
  },
  {
    "id": 394,
    "titulo": "Apertura del Congreso Anfictiónico de Panamá convocado por Simón Bolívar",
    "anio": 1826,
    "descripcion": "El sensor de coherencia temporal susurra: \"Apertura del Congreso Anfictiónico de Panamá convocado por Simón Bolívar\". Nada de esto debería sorprenderte, viajero."
  },
  {
    "id": 395,
    "titulo": "Batalla de Navarino donde la flota aliada destruye la escuadra otomana por Grecia",
    "anio": 1827,
    "descripcion": "Bitácora de los Arquitectos del Tiempo: \"Batalla de Navarino donde la flota aliada destruye la escuadra otomana por Grecia\". Otro ladrillo más en el muro de la Historia (con mayúscula)."
  },
  {
    "id": 396,
    "titulo": "Firma del Tratado de Montevideo que reconoce la independencia total de Uruguay",
    "anio": 1828,
    "descripcion": "Aviso desde el centro de control: \"Firma del Tratado de Montevideo que reconoce la independencia total de Uruguay\". Se ruega no tocar nada más, ya tuvimos suficiente con la aspiradora."
  },
  {
    "id": 397,
    "titulo": "Aprobación del Acta de Emancipación Católica en el Parlamento del Reino Unido",
    "anio": 1829,
    "descripcion": "Eco cronológico detectado: \"Aprobación del Acta de Emancipación Católica en el Parlamento del Reino Unido\". Verificado por triplicado — el tejido espacio-tiempo lo agradece."
  },
  {
    "id": 398,
    "titulo": "Revolución de Julio en Francia que derroca a Carlos X y entrona a Luis Felipe I",
    "anio": 1830,
    "descripcion": "El Cronolito parpadea y muestra: \"Revolución de Julio en Francia que derroca a Carlos X y entrona a Luis Felipe I\". Colócalo bien o la humanidad se queda sin wifi para siempre."
  },
  {
    "id": 399,
    "titulo": "Abdicación de Pedro I de Brasil y ascenso al trono de su hijo Pedro II",
    "anio": 1831,
    "descripcion": "Informe de campo: \"Abdicación de Pedro I de Brasil y ascenso al trono de su hijo Pedro II\". Ni una paradoja a la vista. Por ahora."
  },
  {
    "id": 400,
    "titulo": "Aprobación de la Gran Ley de Reforma electoral en el Reino Unido",
    "anio": 1832,
    "descripcion": "Susurro del pasado captado por los sensores: \"Aprobación de la Gran Ley de Reforma electoral en el Reino Unido\". Archívalo antes de que el café se enfríe."
  },
  {
    "id": 401,
    "titulo": "Muerte de Fernando VII de España e inicio de la Primera Guerra Carlista",
    "anio": 1833,
    "descripcion": "El oráculo temporal certifica: \"Muerte de Fernando VII de España e inicio de la Primera Guerra Carlista\". Esto sí que pasó, no como lo del becario y la aspiradora."
  },
  {
    "id": 402,
    "titulo": "Abolición oficial y definitiva del tribunal de la Inquisición en España",
    "anio": 1834,
    "descripcion": "Pieza recuperada del suelo de la sala del Cronolito: \"Abolición oficial y definitiva del tribunal de la Inquisición en España\". Un poco de polvo, pero intacta."
  },
  {
    "id": 403,
    "titulo": "Estallido de la Revolución de Texas contra el gobierno centralista mexicano de Santa Anna",
    "anio": 1835,
    "descripcion": "Consulta al archivo maestro: \"Estallido de la Revolución de Texas contra el gobierno centralista mexicano de Santa Anna\". Coincide con los registros oficiales de la Orden."
  },
  {
    "id": 404,
    "titulo": "Batalla de El Álamo y posterior independencia de la República de Texas",
    "anio": 1836,
    "descripcion": "Alerta de baja prioridad: \"Batalla de El Álamo y posterior independencia de la República de Texas\". Ni rastro de paradojas ni de becarios torpes en las cercanías."
  },
  {
    "id": 405,
    "titulo": "Ascenso de la reina Victoria al trono del Reino Unido de Gran Bretaña e Irlanda",
    "anio": 1837,
    "descripcion": "Registro del Cronolito: \"Ascenso de la reina Victoria al trono del Reino Unido de Gran Bretaña e Irlanda\". Los Arquitectos confirman que, efectivamente, esto pasó ANTES de que existiera el wifi."
  },
  {
    "id": 406,
    "titulo": "Inicio de la Primera Guerra del Opio entre el Imperio Británico y China",
    "anio": 1838,
    "descripcion": "Nota del becario al margen: \"Inicio de la Primera Guerra del Opio entre el Imperio Británico y China\". (Sigo sin encontrar el cable de la aspiradora, por cierto)."
  },
  {
    "id": 407,
    "titulo": "Presentación oficial del daguerrotipo por Louis Daguerre ante la Academia de Ciencias de París",
    "anio": 1839,
    "descripcion": "Escaneo temporal completado: \"Presentación oficial del daguerrotipo por Louis Daguerre ante la Academia de Ciencias de París\". Ningún dinosaurio fue visto grabando esto para TikTok. De momento."
  },
  {
    "id": 408,
    "titulo": "Traslado de las cenizas de Napoleón Bonaparte al palacio de Los Inválidos en París",
    "anio": 1840,
    "descripcion": "Fragmento recuperado del Cronolito: \"Traslado de las cenizas de Napoleón Bonaparte al palacio de Los Inválidos en París\". Coeficiente de paradoja: bajo. Se puede archivar sin pánico."
  },
  {
    "id": 409,
    "titulo": "Firma del Tratado de las Puertas que pone fin a la guerra de Oriente Medio",
    "anio": 1841,
    "descripcion": "El sensor de coherencia temporal susurra: \"Firma del Tratado de las Puertas que pone fin a la guerra de Oriente Medio\". Nada de esto debería sorprenderte, viajero."
  },
  {
    "id": 410,
    "titulo": "Firma del Tratado de Nankín por el que China cede Hong Kong a Gran Bretaña",
    "anio": 1842,
    "descripcion": "Bitácora de los Arquitectos del Tiempo: \"Firma del Tratado de Nankín por el que China cede Hong Kong a Gran Bretaña\". Otro ladrillo más en el muro de la Historia (con mayúscula)."
  },
  {
    "id": 411,
    "titulo": "Isabel II es declarada mayor de edad a los trece años y asume el trono español",
    "anio": 1843,
    "descripcion": "Aviso desde el centro de control: \"Isabel II es declarada mayor de edad a los trece años y asume el trono español\". Se ruega no tocar nada más, ya tuvimos suficiente con la aspiradora."
  },
  {
    "id": 412,
    "titulo": "Independencia de la República Dominicana respecto al dominio de Haití",
    "anio": 1844,
    "descripcion": "Eco cronológico detectado: \"Independencia de la República Dominicana respecto al dominio de Haití\". Verificado por triplicado — el tejido espacio-tiempo lo agradece."
  },
  {
    "id": 413,
    "titulo": "Anexión formal de la República de Texas a los Estados Unidos de América",
    "anio": 1845,
    "descripcion": "El Cronolito parpadea y muestra: \"Anexión formal de la República de Texas a los Estados Unidos de América\". Colócalo bien o la humanidad se queda sin wifi para siempre."
  },
  {
    "id": 414,
    "titulo": "Inicio de la intervención estadounidense en México por disputas fronterizas",
    "anio": 1846,
    "descripcion": "Informe de campo: \"Inicio de la intervención estadounidense en México por disputas fronterizas\". Ni una paradoja a la vista. Por ahora."
  },
  {
    "id": 415,
    "titulo": "Las tropas estadounidenses capturan el castillo de Chapultepec en Ciudad de México",
    "anio": 1847,
    "descripcion": "Susurro del pasado captado por los sensores: \"Las tropas estadounidenses capturan el castillo de Chapultepec en Ciudad de México\". Archívalo antes de que el café se enfríe."
  },
  {
    "id": 416,
    "titulo": "Publicación del Manifiesto Comunista de Marx y Engels y oleada revolucionaria europea",
    "anio": 1848,
    "descripcion": "El oráculo temporal certifica: \"Publicación del Manifiesto Comunista de Marx y Engels y oleada revolucionaria europea\". Esto sí que pasó, no como lo del becario y la aspiradora."
  },
  {
    "id": 417,
    "titulo": "Proclamación de la efímera República Romana que exilia temporalmente al papa Pío IX",
    "anio": 1849,
    "descripcion": "Pieza recuperada del suelo de la sala del Cronolito: \"Proclamación de la efímera República Romana que exilia temporalmente al papa Pío IX\". Un poco de polvo, pero intacta."
  },
  {
    "id": 418,
    "titulo": "Firma del Compromiso de 1850 en EE.UU. intentando aplacar las tensiones sobre la esclavitud",
    "anio": 1850,
    "descripcion": "Consulta al archivo maestro: \"Firma del Compromiso de 1850 en EE.UU. intentando aplacar las tensiones sobre la esclavitud\". Coincide con los registros oficiales de la Orden."
  },
  {
    "id": 419,
    "titulo": "Inauguración de la Gran Exposición en el Palacio de Cristal de Londres",
    "anio": 1851,
    "descripcion": "Alerta de baja prioridad: \"Inauguración de la Gran Exposición en el Palacio de Cristal de Londres\". Ni rastro de paradojas ni de becarios torpes en las cercanías."
  },
  {
    "id": 420,
    "titulo": "Proclamación del Segundo Imperio Francés con Napoleón III como emperador",
    "anio": 1852,
    "descripcion": "Registro del Cronolito: \"Proclamación del Segundo Imperio Francés con Napoleón III como emperador\". Los Arquitectos confirman que, efectivamente, esto pasó ANTES de que existiera el wifi."
  },
  {
    "id": 421,
    "titulo": "El comodoro Matthew Perry llega a la bahía de Tokio obligando a la apertura de Japón",
    "anio": 1853,
    "descripcion": "Nota del becario al margen: \"El comodoro Matthew Perry llega a la bahía de Tokio obligando a la apertura de Japón\". (Sigo sin encontrar el cable de la aspiradora, por cierto)."
  },
  {
    "id": 422,
    "titulo": "Inicio del Sitio de Sebastopol durante la Guerra de Crimea",
    "anio": 1854,
    "descripcion": "Escaneo temporal completado: \"Inicio del Sitio de Sebastopol durante la Guerra de Crimea\". Ningún dinosaurio fue visto grabando esto para TikTok. De momento."
  },
  {
    "id": 423,
    "titulo": "Inauguración del ferrocarril de Panamá, primera línea transístmica del mundo",
    "anio": 1855,
    "descripcion": "Fragmento recuperado del Cronolito: \"Inauguración del ferrocarril de Panamá, primera línea transístmica del mundo\". Coeficiente de paradoja: bajo. Se puede archivar sin pánico."
  },
  {
    "id": 424,
    "titulo": "Firma del Tratado de París que pone fin a la Guerra de Crimea",
    "anio": 1856,
    "descripcion": "El sensor de coherencia temporal susurra: \"Firma del Tratado de París que pone fin a la Guerra de Crimea\". Nada de esto debería sorprenderte, viajero."
  },
  {
    "id": 425,
    "titulo": "Estallido de la Rebelión de los Cipayos contra la Compañía de las Indias en la India",
    "anio": 1857,
    "descripcion": "Bitácora de los Arquitectos del Tiempo: \"Estallido de la Rebelión de los Cipayos contra la Compañía de las Indias en la India\". Otro ladrillo más en el muro de la Historia (con mayúscula)."
  },
  {
    "id": 426,
    "titulo": "Firma del Tratado de Aigun por el que Rusia anexa territorios de Manchuria a China",
    "anio": 1858,
    "descripcion": "Aviso desde el centro de control: \"Firma del Tratado de Aigun por el que Rusia anexa territorios de Manchuria a China\". Se ruega no tocar nada más, ya tuvimos suficiente con la aspiradora."
  },
  {
    "id": 427,
    "titulo": "Publicación de El origen de las especies del naturalista británico Charles Darwin",
    "anio": 1859,
    "descripcion": "Eco cronológico detectado: \"Publicación de El origen de las especies del naturalista británico Charles Darwin\". Verificado por triplicado — el tejido espacio-tiempo lo agradece."
  },
  {
    "id": 428,
    "titulo": "Elección presidencial de Abraham Lincoln en los Estados Unidos de América",
    "anio": 1860,
    "descripcion": "El Cronolito parpadea y muestra: \"Elección presidencial de Abraham Lincoln en los Estados Unidos de América\". Colócalo bien o la humanidad se queda sin wifi para siempre."
  },
  {
    "id": 429,
    "titulo": "Inicio de la Guerra de Secesión estadounidense tras el ataque a Fort Sumter",
    "anio": 1861,
    "descripcion": "Informe de campo: \"Inicio de la Guerra de Secesión estadounidense tras el ataque a Fort Sumter\". Ni una paradoja a la vista. Por ahora."
  },
  {
    "id": 430,
    "titulo": "Batalla de Puebla donde el ejército mexicano derrota a las tropas invasoras francesas",
    "anio": 1862,
    "descripcion": "Susurro del pasado captado por los sensores: \"Batalla de Puebla donde el ejército mexicano derrota a las tropas invasoras francesas\". Archívalo antes de que el café se enfríe."
  },
  {
    "id": 431,
    "titulo": "Proclamación de Emancipación en EE.UU. y Batalla de Gettysburg",
    "anio": 1863,
    "descripcion": "El oráculo temporal certifica: \"Proclamación de Emancipación en EE.UU. y Batalla de Gettysburg\". Esto sí que pasó, no como lo del becario y la aspiradora."
  },
  {
    "id": 432,
    "titulo": "Fundación de la Primera Internacional de Trabajadores en la ciudad de Londres",
    "anio": 1864,
    "descripcion": "Pieza recuperada del suelo de la sala del Cronolito: \"Fundación de la Primera Internacional de Trabajadores en la ciudad de Londres\". Un poco de polvo, pero intacta."
  },
  {
    "id": 433,
    "titulo": "Asesinato del presidente Abraham Lincoln en el Teatro Ford de Washington",
    "anio": 1865,
    "descripcion": "Consulta al archivo maestro: \"Asesinato del presidente Abraham Lincoln en el Teatro Ford de Washington\". Coincide con los registros oficiales de la Orden."
  },
  {
    "id": 434,
    "titulo": "Batalla de Sadowa que decide la Guerra Austro-Prusiana a favor de Prusia",
    "anio": 1866,
    "descripcion": "Alerta de baja prioridad: \"Batalla de Sadowa que decide la Guerra Austro-Prusiana a favor de Prusia\". Ni rastro de paradojas ni de becarios torpes en las cercanías."
  },
  {
    "id": 435,
    "titulo": "Estados Unidos compra el territorio de Alaska al Imperio Ruso",
    "anio": 1867,
    "descripcion": "Registro del Cronolito: \"Estados Unidos compra el territorio de Alaska al Imperio Ruso\". Los Arquitectos confirman que, efectivamente, esto pasó ANTES de que existiera el wifi."
  },
  {
    "id": 436,
    "titulo": "La Revolución Gloriosa derroca a la reina Isabel II de España",
    "anio": 1868,
    "descripcion": "Nota del becario al margen: \"La Revolución Gloriosa derroca a la reina Isabel II de España\". (Sigo sin encontrar el cable de la aspiradora, por cierto)."
  },
  {
    "id": 437,
    "titulo": "Inauguración oficial del Canal de Suez conectando el Mediterráneo y el Mar Rojo",
    "anio": 1869,
    "descripcion": "Escaneo temporal completado: \"Inauguración oficial del Canal de Suez conectando el Mediterráneo y el Mar Rojo\". Ningún dinosaurio fue visto grabando esto para TikTok. De momento."
  },
  {
    "id": 438,
    "titulo": "Batalla de Sedán, caída de Napoleón III y proclamación de la Tercera República Francesa",
    "anio": 1870,
    "descripcion": "Fragmento recuperado del Cronolito: \"Batalla de Sedán, caída de Napoleón III y proclamación de la Tercera República Francesa\". Coeficiente de paradoja: bajo. Se puede archivar sin pánico."
  },
  {
    "id": 439,
    "titulo": "Proclamación del Imperio Alemán en el Salón de los Espejos de Versalles",
    "anio": 1871,
    "descripcion": "El sensor de coherencia temporal susurra: \"Proclamación del Imperio Alemán en el Salón de los Espejos de Versalles\". Nada de esto debería sorprenderte, viajero."
  },
  {
    "id": 440,
    "titulo": "Estallido de la Tercera Guerra Carlista en el territorio del norte de España",
    "anio": 1872,
    "descripcion": "Bitácora de los Arquitectos del Tiempo: \"Estallido de la Tercera Guerra Carlista en el territorio del norte de España\". Otro ladrillo más en el muro de la Historia (con mayúscula)."
  },
  {
    "id": 441,
    "titulo": "Abdicación de Amadeo de Saboya y proclamación de la Primera República Española",
    "anio": 1873,
    "descripcion": "Aviso desde el centro de control: \"Abdicación de Amadeo de Saboya y proclamación de la Primera República Española\". Se ruega no tocar nada más, ya tuvimos suficiente con la aspiradora."
  },
  {
    "id": 442,
    "titulo": "Pronunciamiento de Sagunto que restaura la monarquía borbónica con Alfonso XII",
    "anio": 1874,
    "descripcion": "Eco cronológico detectado: \"Pronunciamiento de Sagunto que restaura la monarquía borbónica con Alfonso XII\". Verificado por triplicado — el tejido espacio-tiempo lo agradece."
  },
  {
    "id": 443,
    "titulo": "Promulgación de las Leyes Constitucionales de la Tercera República Francesa",
    "anio": 1875,
    "descripcion": "El Cronolito parpadea y muestra: \"Promulgación de las Leyes Constitucionales de la Tercera República Francesa\". Colócalo bien o la humanidad se queda sin wifi para siempre."
  },
  {
    "id": 444,
    "titulo": "Alexander Graham Bell patenta con éxito el teléfono eléctrico en EE.UU.",
    "anio": 1876,
    "descripcion": "Informe de campo: \"Alexander Graham Bell patenta con éxito el teléfono eléctrico en EE.UU.\". Ni una paradoja a la vista. Por ahora."
  },
  {
    "id": 445,
    "titulo": "Proclamación de la reina Victoria como Emperatriz de la India en Delhi",
    "anio": 1877,
    "descripcion": "Susurro del pasado captado por los sensores: \"Proclamación de la reina Victoria como Emperatriz de la India en Delhi\". Archívalo antes de que el café se enfríe."
  },
  {
    "id": 446,
    "titulo": "Firma del Tratado de Berlín que reorganiza los territorios de los Balcanes",
    "anio": 1878,
    "descripcion": "El oráculo temporal certifica: \"Firma del Tratado de Berlín que reorganiza los territorios de los Balcanes\". Esto sí que pasó, no como lo del becario y la aspiradora."
  },
  {
    "id": 447,
    "titulo": "Estallido de la Guerra del Pacífico entre Chile, Perú y Bolivia",
    "anio": 1879,
    "descripcion": "Pieza recuperada del suelo de la sala del Cronolito: \"Estallido de la Guerra del Pacífico entre Chile, Perú y Bolivia\". Un poco de polvo, pero intacta."
  },
  {
    "id": 448,
    "titulo": "Aprobación de la ley que decreta la abolición progresiva de la esclavitud en Cuba",
    "anio": 1880,
    "descripcion": "Consulta al archivo maestro: \"Aprobación de la ley que decreta la abolición progresiva de la esclavitud en Cuba\". Coincide con los registros oficiales de la Orden."
  },
  {
    "id": 449,
    "titulo": "Asesinato del zar Alejandro II de Rusia por un atentado con bomba en San Petersburgo",
    "anio": 1881,
    "descripcion": "Alerta de baja prioridad: \"Asesinato del zar Alejandro II de Rusia por un atentado con bomba en San Petersburgo\". Ni rastro de paradojas ni de becarios torpes en las cercanías."
  },
  {
    "id": 450,
    "titulo": "Firma de la Triple Alianza entre Alemania, Austria-Hungría e Italia",
    "anio": 1882,
    "descripcion": "Registro del Cronolito: \"Firma de la Triple Alianza entre Alemania, Austria-Hungría e Italia\". Los Arquitectos confirman que, efectivamente, esto pasó ANTES de que existiera el wifi."
  },
  {
    "id": 451,
    "titulo": "Erupción del volcán Krakatoa provocando masivos tsunamis globales",
    "anio": 1883,
    "descripcion": "Nota del becario al margen: \"Erupción del volcán Krakatoa provocando masivos tsunamis globales\". (Sigo sin encontrar el cable de la aspiradora, por cierto)."
  },
  {
    "id": 452,
    "titulo": "Apertura de la Conferencia de Berlín para el reparto colonial del continente africano",
    "anio": 1884,
    "descripcion": "Escaneo temporal completado: \"Apertura de la Conferencia de Berlín para el reparto colonial del continente africano\". Ningún dinosaurio fue visto grabando esto para TikTok. De momento."
  },
  {
    "id": 453,
    "titulo": "Fallecimiento del rey Alfonso XII de España abriendo la regencia de María Cristina",
    "anio": 1885,
    "descripcion": "Fragmento recuperado del Cronolito: \"Fallecimiento del rey Alfonso XII de España abriendo la regencia de María Cristina\". Coeficiente de paradoja: bajo. Se puede archivar sin pánico."
  },
  {
    "id": 454,
    "titulo": "Inauguración oficial de la Estatua de la Libertad en la bahía de Nueva York",
    "anio": 1886,
    "descripcion": "El sensor de coherencia temporal susurra: \"Inauguración oficial de la Estatua de la Libertad en la bahía de Nueva York\". Nada de esto debería sorprenderte, viajero."
  },
  {
    "id": 455,
    "titulo": "Inicio de la construcción de la Torre Eiffel para la Exposición Universal de París",
    "anio": 1887,
    "descripcion": "Bitácora de los Arquitectos del Tiempo: \"Inicio de la construcción de la Torre Eiffel para la Exposición Universal de París\". Otro ladrillo más en el muro de la Historia (con mayúscula)."
  },
  {
    "id": 456,
    "titulo": "Ascenso de Guillermo II al trono imperial de Alemania, el año de los tres emperadores",
    "anio": 1888,
    "descripcion": "Aviso desde el centro de control: \"Ascenso de Guillermo II al trono imperial de Alemania, el año de los tres emperadores\". Se ruega no tocar nada más, ya tuvimos suficiente con la aspiradora."
  },
  {
    "id": 457,
    "titulo": "Proclamación de la República de Brasil tras el derrocamiento del emperador Pedro II",
    "anio": 1889,
    "descripcion": "Eco cronológico detectado: \"Proclamación de la República de Brasil tras el derrocamiento del emperador Pedro II\". Verificado por triplicado — el tejido espacio-tiempo lo agradece."
  },
  {
    "id": 458,
    "titulo": "Dimisión forzada del canciller alemán Otto von Bismarck por discrepancias con el emperador",
    "anio": 1890,
    "descripcion": "El Cronolito parpadea y muestra: \"Dimisión forzada del canciller alemán Otto von Bismarck por discrepancias con el emperador\". Colócalo bien o la humanidad se queda sin wifi para siempre."
  },
  {
    "id": 459,
    "titulo": "Encíclica Rerum Novarum del papa León XIII sobre las condiciones de las clases trabajadoras",
    "anio": 1891,
    "descripcion": "Informe de campo: \"Encíclica Rerum Novarum del papa León XIII sobre las condiciones de las clases trabajadoras\". Ni una paradoja a la vista. Por ahora."
  },
  {
    "id": 460,
    "titulo": "Fundación del Partido Revolucionario Cubano por José Martí en Nueva York",
    "anio": 1892,
    "descripcion": "Susurro del pasado captado por los sensores: \"Fundación del Partido Revolucionario Cubano por José Martí en Nueva York\". Archívalo antes de que el café se enfríe."
  },
  {
    "id": 461,
    "titulo": "Nueva Zelanda se convierte en el primer país en otorgar el sufragio femenino nacional",
    "anio": 1893,
    "descripcion": "El oráculo temporal certifica: \"Nueva Zelanda se convierte en el primer país en otorgar el sufragio femenino nacional\". Esto sí que pasó, no como lo del becario y la aspiradora."
  },
  {
    "id": 462,
    "titulo": "Arresto del capitán Alfred Dreyfus en París iniciando el célebre Caso Dreyfus",
    "anio": 1894,
    "descripcion": "Pieza recuperada del suelo de la sala del Cronolito: \"Arresto del capitán Alfred Dreyfus en París iniciando el célebre Caso Dreyfus\". Un poco de polvo, pero intacta."
  },
  {
    "id": 463,
    "titulo": "Los hermanos Lumière realizan la primera proyección pública cinematográfica comercial en París",
    "anio": 1895,
    "descripcion": "Consulta al archivo maestro: \"Los hermanos Lumière realizan la primera proyección pública cinematográfica comercial en París\". Coincide con los registros oficiales de la Orden."
  },
  {
    "id": 464,
    "titulo": "Celebración en Atenas de los primeros Juegos Olímpicos de la era moderna",
    "anio": 1896,
    "descripcion": "Alerta de baja prioridad: \"Celebración en Atenas de los primeros Juegos Olímpicos de la era moderna\". Ni rastro de paradojas ni de becarios torpes en las cercanías."
  },
  {
    "id": 465,
    "titulo": "Asesinato del presidente del gobierno español Antonio Cánovas del Castillo por un anarquista",
    "anio": 1897,
    "descripcion": "Registro del Cronolito: \"Asesinato del presidente del gobierno español Antonio Cánovas del Castillo por un anarquista\". Los Arquitectos confirman que, efectivamente, esto pasó ANTES de que existiera el wifi."
  },
  {
    "id": 466,
    "titulo": "Hundimiento del USS Maine en La Habana desencadenando la Guerra Hispano-Estadounidense",
    "anio": 1898,
    "descripcion": "Nota del becario al margen: \"Hundimiento del USS Maine en La Habana desencadenando la Guerra Hispano-Estadounidense\". (Sigo sin encontrar el cable de la aspiradora, por cierto)."
  },
  {
    "id": 467,
    "titulo": "Estallido de la Guerra de los Mil Días, conflicto civil en Colombia",
    "anio": 1899,
    "descripcion": "Escaneo temporal completado: \"Estallido de la Guerra de los Mil Días, conflicto civil en Colombia\". Ningún dinosaurio fue visto grabando esto para TikTok. De momento."
  },
  {
    "id": 468,
    "titulo": "El dirigible Zeppelin realiza su vuelo inaugural sobre el lago de Constanza",
    "anio": 1900,
    "descripcion": "Fragmento recuperado del Cronolito: \"El dirigible Zeppelin realiza su vuelo inaugural sobre el lago de Constanza\". Coeficiente de paradoja: bajo. Se puede archivar sin pánico."
  },
  {
    "id": 469,
    "titulo": "Fallecimiento de la reina Victoria del Reino Unido tras 63 años de reinado",
    "anio": 1901,
    "descripcion": "El sensor de coherencia temporal susurra: \"Fallecimiento de la reina Victoria del Reino Unido tras 63 años de reinado\". Nada de esto debería sorprenderte, viajero."
  },
  {
    "id": 470,
    "titulo": "Fin de la Guerra de los Bóeres con la firma del Tratado de Vereeniging",
    "anio": 1902,
    "descripcion": "Bitácora de los Arquitectos del Tiempo: \"Fin de la Guerra de los Bóeres con la firma del Tratado de Vereeniging\". Otro ladrillo más en el muro de la Historia (con mayúscula)."
  },
  {
    "id": 471,
    "titulo": "Los hermanos Wright realizan el primer vuelo propulsado a motor de la historia",
    "anio": 1903,
    "descripcion": "Aviso desde el centro de control: \"Los hermanos Wright realizan el primer vuelo propulsado a motor de la historia\". Se ruega no tocar nada más, ya tuvimos suficiente con la aspiradora."
  },
  {
    "id": 472,
    "titulo": "Estallido de la Guerra Ruso-Japonesa por disputas en Manchuria y Corea",
    "anio": 1904,
    "descripcion": "Eco cronológico detectado: \"Estallido de la Guerra Ruso-Japonesa por disputas en Manchuria y Corea\". Verificado por triplicado — el tejido espacio-tiempo lo agradece."
  },
  {
    "id": 473,
    "titulo": "Domingo Sangriento en San Petersburgo e inicio de la Revolución Rusa de 1905",
    "anio": 1905,
    "descripcion": "El Cronolito parpadea y muestra: \"Domingo Sangriento en San Petersburgo e inicio de la Revolución Rusa de 1905\". Colócalo bien o la humanidad se queda sin wifi para siempre."
  },
  {
    "id": 474,
    "titulo": "Terremoto e incendios devastan la ciudad de San Francisco en California",
    "anio": 1906,
    "descripcion": "Informe de campo: \"Terremoto e incendios devastan la ciudad de San Francisco en California\". Ni una paradoja a la vista. Por ahora."
  },
  {
    "id": 475,
    "titulo": "Firma de la Triple Entente entre Gran Bretaña, Francia y el Imperio Ruso",
    "anio": 1907,
    "descripcion": "Susurro del pasado captado por los sensores: \"Firma de la Triple Entente entre Gran Bretaña, Francia y el Imperio Ruso\". Archívalo antes de que el café se enfríe."
  },
  {
    "id": 476,
    "titulo": "El Imperio Austro-Húngaro se anexa formalmente la provincia de Bosnia y Herzegovina",
    "anio": 1908,
    "descripcion": "El oráculo temporal certifica: \"El Imperio Austro-Húngaro se anexa formalmente la provincia de Bosnia y Herzegovina\". Esto sí que pasó, no como lo del becario y la aspiradora."
  },
  {
    "id": 477,
    "titulo": "Estallido de la Semana Trágica en Barcelona por las levas para la Guerra de Melilla",
    "anio": 1909,
    "descripcion": "Pieza recuperada del suelo de la sala del Cronolito: \"Estallido de la Semana Trágica en Barcelona por las levas para la Guerra de Melilla\". Un poco de polvo, pero intacta."
  },
  {
    "id": 478,
    "titulo": "Inicio de la Revolución Mexicana con el levantamiento convocado por Francisco I. Madero",
    "anio": 1910,
    "descripcion": "Consulta al archivo maestro: \"Inicio de la Revolución Mexicana con el levantamiento convocado por Francisco I. Madero\". Coincide con los registros oficiales de la Orden."
  },
  {
    "id": 479,
    "titulo": "El explorador Roald Amundsen alcanza el Polo Sur geográfico por primera vez",
    "anio": 1911,
    "descripcion": "Alerta de baja prioridad: \"El explorador Roald Amundsen alcanza el Polo Sur geográfico por primera vez\". Ni rastro de paradojas ni de becarios torpes en las cercanías."
  },
  {
    "id": 480,
    "titulo": "Hundimiento del transatlántico RMS Titanic tras colisionar con un iceberg",
    "anio": 1912,
    "descripcion": "Registro del Cronolito: \"Hundimiento del transatlántico RMS Titanic tras colisionar con un iceberg\". Los Arquitectos confirman que, efectivamente, esto pasó ANTES de que existiera el wifi."
  },
  {
    "id": 481,
    "titulo": "Firma del Tratado de Bucarest que pone fin a las Guerras de los Balcanes",
    "anio": 1913,
    "descripcion": "Nota del becario al margen: \"Firma del Tratado de Bucarest que pone fin a las Guerras de los Balcanes\". (Sigo sin encontrar el cable de la aspiradora, por cierto)."
  },
  {
    "id": 482,
    "titulo": "Asesinato del archiduque Francisco Fernando en Sarajevo desencadenando la Primera Guerra Mundial",
    "anio": 1914,
    "descripcion": "Escaneo temporal completado: \"Asesinato del archiduque Francisco Fernando en Sarajevo desencadenando la Primera Guerra Mundial\". Ningún dinosaurio fue visto grabando esto para TikTok. De momento."
  },
  {
    "id": 483,
    "titulo": "Hundimiento del transatlántico británico RMS Lusitania por un submarino alemán",
    "anio": 1915,
    "descripcion": "Fragmento recuperado del Cronolito: \"Hundimiento del transatlántico británico RMS Lusitania por un submarino alemán\". Coeficiente de paradoja: bajo. Se puede archivar sin pánico."
  },
  {
    "id": 484,
    "titulo": "Batalla de Verdún, el enfrentamiento más largo de la Primera Guerra Mundial",
    "anio": 1916,
    "descripcion": "El sensor de coherencia temporal susurra: \"Batalla de Verdún, el enfrentamiento más largo de la Primera Guerra Mundial\". Nada de esto debería sorprenderte, viajero."
  },
  {
    "id": 485,
    "titulo": "Revolución de Octubre en Rusia comandada por los bolcheviques de Lenin",
    "anio": 1917,
    "descripcion": "Bitácora de los Arquitectos del Tiempo: \"Revolución de Octubre en Rusia comandada por los bolcheviques de Lenin\". Otro ladrillo más en el muro de la Historia (con mayúscula)."
  },
  {
    "id": 486,
    "titulo": "Firma del Armisticio de Compiègne que pone fin a los combates de la Primera Guerra Mundial",
    "anio": 1918,
    "descripcion": "Aviso desde el centro de control: \"Firma del Armisticio de Compiègne que pone fin a los combates de la Primera Guerra Mundial\". Se ruega no tocar nada más, ya tuvimos suficiente con la aspiradora."
  },
  {
    "id": 487,
    "titulo": "Firma del Tratado de Versalles que impone duras condiciones de paz a Alemania",
    "anio": 1919,
    "descripcion": "Eco cronológico detectado: \"Firma del Tratado de Versalles que impone duras condiciones de paz a Alemania\". Verificado por triplicado — el tejido espacio-tiempo lo agradece."
  },
  {
    "id": 488,
    "titulo": "Entrada en vigor de la Ley Seca en todo el territorio de los Estados Unidos",
    "anio": 1920,
    "descripcion": "El Cronolito parpadea y muestra: \"Entrada en vigor de la Ley Seca en todo el territorio de los Estados Unidos\". Colócalo bien o la humanidad se queda sin wifi para siempre."
  },
  {
    "id": 489,
    "titulo": "Finalización de la Guerra de Independencia Irlandesa tras la firma del Tratado Anglo-Irlandés",
    "anio": 1921,
    "descripcion": "Informe de campo: \"Finalización de la Guerra de Independencia Irlandesa tras la firma del Tratado Anglo-Irlandés\". Ni una paradoja a la vista. Por ahora."
  },
  {
    "id": 490,
    "titulo": "Benito Mussolini asume el poder en Italia tras la Marcha sobre Roma",
    "anio": 1922,
    "descripcion": "Susurro del pasado captado por los sensores: \"Benito Mussolini asume el poder en Italia tras la Marcha sobre Roma\". Archívalo antes de que el café se enfríe."
  },
  {
    "id": 491,
    "titulo": "Fracaso del Putsch de la Cervecería intentado por Adolf Hitler en Múnich",
    "anio": 1923,
    "descripcion": "El oráculo temporal certifica: \"Fracaso del Putsch de la Cervecería intentado por Adolf Hitler en Múnich\". Esto sí que pasó, no como lo del becario y la aspiradora."
  },
  {
    "id": 492,
    "titulo": "Fallecimiento de Vladimir Lenin y ascenso paulatino de Iósif Stalin en la URSS",
    "anio": 1924,
    "descripcion": "Pieza recuperada del suelo de la sala del Cronolito: \"Fallecimiento de Vladimir Lenin y ascenso paulatino de Iósif Stalin en la URSS\". Un poco de polvo, pero intacta."
  },
  {
    "id": 493,
    "titulo": "Publicación del tratado político e ideológico Mein Kampf de Adolf Hitler",
    "anio": 1925,
    "descripcion": "Consulta al archivo maestro: \"Publicación del tratado político e ideológico Mein Kampf de Adolf Hitler\". Coincide con los registros oficiales de la Orden."
  },
  {
    "id": 494,
    "titulo": "Hirohito es coronado como nuevo Emperador de Japón",
    "anio": 1926,
    "descripcion": "Alerta de baja prioridad: \"Hirohito es coronado como nuevo Emperador de Japón\". Ni rastro de paradojas ni de becarios torpes en las cercanías."
  },
  {
    "id": 495,
    "titulo": "Charles Lindbergh completa el primer vuelo transatlántico en solitario sin escalas",
    "anio": 1927,
    "descripcion": "Registro del Cronolito: \"Charles Lindbergh completa el primer vuelo transatlántico en solitario sin escalas\". Los Arquitectos confirman que, efectivamente, esto pasó ANTES de que existiera el wifi."
  },
  {
    "id": 496,
    "titulo": "Alexander Fleming descubre de forma accidental la penicilina en Londres",
    "anio": 1928,
    "descripcion": "Nota del becario al margen: \"Alexander Fleming descubre de forma accidental la penicilina en Londres\". (Sigo sin encontrar el cable de la aspiradora, por cierto)."
  },
  {
    "id": 497,
    "titulo": "Crack de la Bolsa de Nueva York dando inicio a la Gran Depresión mundial",
    "anio": 1929,
    "descripcion": "Escaneo temporal completado: \"Crack de la Bolsa de Nueva York dando inicio a la Gran Depresión mundial\". Ningún dinosaurio fue visto grabando esto para TikTok. De momento."
  },
  {
    "id": 498,
    "titulo": "Celebración en Uruguay de la primera Copa Mundial de Fútbol de la historia",
    "anio": 1930,
    "descripcion": "Fragmento recuperado del Cronolito: \"Celebración en Uruguay de la primera Copa Mundial de Fútbol de la historia\". Coeficiente de paradoja: bajo. Se puede archivar sin pánico."
  },
  {
    "id": 499,
    "titulo": "Proclamación de la Segunda República Española tras el exilio de Alfonso XIII",
    "anio": 1931,
    "descripcion": "El sensor de coherencia temporal susurra: \"Proclamación de la Segunda República Española tras el exilio de Alfonso XIII\". Nada de esto debería sorprenderte, viajero."
  },
  {
    "id": 500,
    "titulo": "Franklin D. Roosevelt gana las elecciones presidenciales de Estados Unidos",
    "anio": 1932,
    "descripcion": "Bitácora de los Arquitectos del Tiempo: \"Franklin D. Roosevelt gana las elecciones presidenciales de Estados Unidos\". Otro ladrillo más en el muro de la Historia (con mayúscula)."
  },
  {
    "id": 501,
    "titulo": "Adolf Hitler es nombrado Canciller de Alemania por el presidente Hindenburg",
    "anio": 1933,
    "descripcion": "Aviso desde el centro de control: \"Adolf Hitler es nombrado Canciller de Alemania por el presidente Hindenburg\". Se ruega no tocar nada más, ya tuvimos suficiente con la aspiradora."
  },
  {
    "id": 502,
    "titulo": "Mao Zedong inicia la Larga Marcha con las fuerzas comunistas chinas",
    "anio": 1934,
    "descripcion": "Eco cronológico detectado: \"Mao Zedong inicia la Larga Marcha con las fuerzas comunistas chinas\". Verificado por triplicado — el tejido espacio-tiempo lo agradece."
  },
  {
    "id": 503,
    "titulo": "Invasión de Etiopía por las tropas de la Italia fascista de Mussolini",
    "anio": 1935,
    "descripcion": "El Cronolito parpadea y muestra: \"Invasión de Etiopía por las tropas de la Italia fascista de Mussolini\". Colócalo bien o la humanidad se queda sin wifi para siempre."
  },
  {
    "id": 504,
    "titulo": "Estallido de la Guerra Civil Española tras el pronunciamiento militar de julio",
    "anio": 1936,
    "descripcion": "Informe de campo: \"Estallido de la Guerra Civil Española tras el pronunciamiento militar de julio\". Ni una paradoja a la vista. Por ahora."
  },
  {
    "id": 505,
    "titulo": "Bombardeo de la villa vasca de Guernica por la Legión Cóndor alemana",
    "anio": 1937,
    "descripcion": "Susurro del pasado captado por los sensores: \"Bombardeo de la villa vasca de Guernica por la Legión Cóndor alemana\". Archívalo antes de que el café se enfríe."
  },
  {
    "id": 506,
    "titulo": "Anexión forzada de Austria por parte de la Alemania nazi, evento conocido como Anschluss",
    "anio": 1938,
    "descripcion": "El oráculo temporal certifica: \"Anexión forzada de Austria por parte de la Alemania nazi, evento conocido como Anschluss\". Esto sí que pasó, no como lo del becario y la aspiradora."
  },
  {
    "id": 507,
    "titulo": "Invasión alemana a Polonia provocando el estallido de la Segunda Guerra Mundial",
    "anio": 1939,
    "descripcion": "Pieza recuperada del suelo de la sala del Cronolito: \"Invasión alemana a Polonia provocando el estallido de la Segunda Guerra Mundial\". Un poco de polvo, pero intacta."
  },
  {
    "id": 508,
    "titulo": "Operación Dinamo y posterior evacuación de las tropas aliadas en Dunkerque",
    "anio": 1940,
    "descripcion": "Consulta al archivo maestro: \"Operación Dinamo y posterior evacuación de las tropas aliadas en Dunkerque\". Coincide con los registros oficiales de la Orden."
  },
  {
    "id": 509,
    "titulo": "Ataque sorpresa japonés a Pearl Harbor provocando la entrada de EE.UU. en la guerra",
    "anio": 1941,
    "descripcion": "Alerta de baja prioridad: \"Ataque sorpresa japonés a Pearl Harbor provocando la entrada de EE.UU. en la guerra\". Ni rastro de paradojas ni de becarios torpes en las cercanías."
  },
  {
    "id": 510,
    "titulo": "Comienzo de la decisiva Batalla de Stalingrado entre tropas soviéticas y alemanas",
    "anio": 1942,
    "descripcion": "Registro del Cronolito: \"Comienzo de la decisiva Batalla de Stalingrado entre tropas soviéticas y alemanas\". Los Arquitectos confirman que, efectivamente, esto pasó ANTES de que existiera el wifi."
  },
  {
    "id": 511,
    "titulo": "Caída del régimen fascista de Benito Mussolini tras la votación del Gran Consejo",
    "anio": 1943,
    "descripcion": "Nota del becario al margen: \"Caída del régimen fascista de Benito Mussolini tras la votación del Gran Consejo\". (Sigo sin encontrar el cable de la aspiradora, por cierto)."
  },
  {
    "id": 512,
    "titulo": "Desembarco aliado en las playas de Normandía en el Día D",
    "anio": 1944,
    "descripcion": "Escaneo temporal completado: \"Desembarco aliado en las playas de Normandía en el Día D\". Ningún dinosaurio fue visto grabando esto para TikTok. De momento."
  },
  {
    "id": 513,
    "titulo": "Lanzamiento de bombas atómicas en Hiroshima y Nagasaki y fin de la Segunda Guerra Mundial",
    "anio": 1945,
    "descripcion": "Fragmento recuperado del Cronolito: \"Lanzamiento de bombas atómicas en Hiroshima y Nagasaki y fin de la Segunda Guerra Mundial\". Coeficiente de paradoja: bajo. Se puede archivar sin pánico."
  },
  {
    "id": 514,
    "titulo": "Celebración de los Juicios de Núremberg contra los líderes criminales nazis",
    "anio": 1946,
    "descripcion": "El sensor de coherencia temporal susurra: \"Celebración de los Juicios de Núremberg contra los líderes criminales nazis\". Nada de esto debería sorprenderte, viajero."
  },
  {
    "id": 515,
    "titulo": "Presentación del Plan Marshall de EE.UU. para la reconstrucción económica de Europa",
    "anio": 1947,
    "descripcion": "Bitácora de los Arquitectos del Tiempo: \"Presentación del Plan Marshall de EE.UU. para la reconstrucción económica de Europa\". Otro ladrillo más en el muro de la Historia (con mayúscula)."
  },
  {
    "id": 516,
    "titulo": "Proclamación del Estado de Estallido de Israel e inicio de la primera guerra árabe-israelí",
    "anio": 1948,
    "descripcion": "Aviso desde el centro de control: \"Proclamación del Estado de Estallido de Israel e inicio de la primera guerra árabe-israelí\". Se ruega no tocar nada más, ya tuvimos suficiente con la aspiradora."
  },
  {
    "id": 517,
    "titulo": "Proclamación de la República Popular China por Mao Zedong en Pekín",
    "anio": 1949,
    "descripcion": "Eco cronológico detectado: \"Proclamación de la República Popular China por Mao Zedong en Pekín\". Verificado por triplicado — el tejido espacio-tiempo lo agradece."
  },
  {
    "id": 518,
    "titulo": "Inicio de la Guerra de Corea tras la invasión de tropas norcoreanas al sur",
    "anio": 1950,
    "descripcion": "El Cronolito parpadea y muestra: \"Inicio de la Guerra de Corea tras la invasión de tropas norcoreanas al sur\". Colócalo bien o la humanidad se queda sin wifi para siempre."
  },
  {
    "id": 519,
    "titulo": "Firma del Tratado de París que crea la Comunidad Europea del Carbón y del Acero",
    "anio": 1951,
    "descripcion": "Informe de campo: \"Firma del Tratado de París que crea la Comunidad Europea del Carbón y del Acero\". Ni una paradoja a la vista. Por ahora."
  },
  {
    "id": 520,
    "titulo": "Ascenso al trono británico de la reina Isabel II tras la muerte de su padre Jorge VI",
    "anio": 1952,
    "descripcion": "Susurro del pasado captado por los sensores: \"Ascenso al trono británico de la reina Isabel II tras la muerte de su padre Jorge VI\". Archívalo antes de que el café se enfríe."
  },
  {
    "id": 521,
    "titulo": "Firma del armisticio de Panmunjom que suspende los combates en Corea",
    "anio": 1953,
    "descripcion": "El oráculo temporal certifica: \"Firma del armisticio de Panmunjom que suspende los combates en Corea\". Esto sí que pasó, no como lo del becario y la aspiradora."
  },
  {
    "id": 522,
    "titulo": "Derrota francesa en Diên Biên Phu que marca el fin de su dominio en Indochina",
    "anio": 1954,
    "descripcion": "Pieza recuperada del suelo de la sala del Cronolito: \"Derrota francesa en Diên Biên Phu que marca el fin de su dominio en Indochina\". Un poco de polvo, pero intacta."
  },
  {
    "id": 523,
    "titulo": "Firma del Pacto de Varsovia por los países del bloque socialista de Europa Oriental",
    "anio": 1955,
    "descripcion": "Consulta al archivo maestro: \"Firma del Pacto de Varsovia por los países del bloque socialista de Europa Oriental\". Coincide con los registros oficiales de la Orden."
  },
  {
    "id": 524,
    "titulo": "Nacionalización del Canal de Suez por Nasser provocando una crisis militar internacional",
    "anio": 1956,
    "descripcion": "Alerta de baja prioridad: \"Nacionalización del Canal de Suez por Nasser provocando una crisis militar internacional\". Ni rastro de paradojas ni de becarios torpes en las cercanías."
  },
  {
    "id": 525,
    "titulo": "Lanzamiento soviético del Sputnik 1, el primer satélite artificial de la historia",
    "anio": 1957,
    "descripcion": "Registro del Cronolito: \"Lanzamiento soviético del Sputnik 1, el primer satélite artificial de la historia\". Los Arquitectos confirman que, efectivamente, esto pasó ANTES de que existiera el wifi."
  },
  {
    "id": 526,
    "titulo": "Creación de la Administración Nacional de Aeronáutica y el Espacio, la NASA",
    "anio": 1958,
    "descripcion": "Nota del becario al margen: \"Creación de la Administración Nacional de Aeronáutica y el Espacio, la NASA\". (Sigo sin encontrar el cable de la aspiradora, por cierto)."
  },
  {
    "id": 527,
    "titulo": "Triunfo de la Revolución Cubana comandada por Fidel Castro entrando en La Habana",
    "anio": 1959,
    "descripcion": "Escaneo temporal completado: \"Triunfo de la Revolución Cubana comandada por Fidel Castro entrando en La Habana\". Ningún dinosaurio fue visto grabando esto para TikTok. De momento."
  },
  {
    "id": 528,
    "titulo": "Descubrimiento del primer rayo láser funcional por el físico Theodore Maiman",
    "anio": 1960,
    "descripcion": "Fragmento recuperado del Cronolito: \"Descubrimiento del primer rayo láser funcional por el físico Theodore Maiman\". Coeficiente de paradoja: bajo. Se puede archivar sin pánico."
  },
  {
    "id": 529,
    "titulo": "Construcción nocturna del Muro de Berlín por las autoridades de la RDA",
    "anio": 1961,
    "descripcion": "El sensor de coherencia temporal susurra: \"Construcción nocturna del Muro de Berlín por las autoridades de la RDA\". Nada de esto debería sorprenderte, viajero."
  },
  {
    "id": 530,
    "titulo": "Crisis de los misiles en Cuba poniendo al mundo al borde de una guerra nuclear",
    "anio": 1962,
    "descripcion": "Bitácora de los Arquitectos del Tiempo: \"Crisis de los misiles en Cuba poniendo al mundo al borde de una guerra nuclear\". Otro ladrillo más en el muro de la Historia (con mayúscula)."
  },
  {
    "id": 531,
    "titulo": "Asesinato del presidente estadounidense John F. Kennedy en Dallas, Texas",
    "anio": 1963,
    "descripcion": "Aviso desde el centro de control: \"Asesinato del presidente estadounidense John F. Kennedy en Dallas, Texas\". Se ruega no tocar nada más, ya tuvimos suficiente con la aspiradora."
  },
  {
    "id": 532,
    "titulo": "Aprobación de la Ley de Derechos Civiles en los Estados Unidos de América",
    "anio": 1964,
    "descripcion": "Eco cronológico detectado: \"Aprobación de la Ley de Derechos Civiles en los Estados Unidos de América\". Verificado por triplicado — el tejido espacio-tiempo lo agradece."
  },
  {
    "id": 533,
    "titulo": "Despliegue formal de las primeras tropas de combate estadounidenses en Vietnam",
    "anio": 1965,
    "descripcion": "El Cronolito parpadea y muestra: \"Despliegue formal de las primeras tropas de combate estadounidenses en Vietnam\". Colócalo bien o la humanidad se queda sin wifi para siempre."
  },
  {
    "id": 534,
    "titulo": "Inicio oficial de la Revolución Cultural Proletaria en la China de Mao Zedong",
    "anio": 1966,
    "descripcion": "Informe de campo: \"Inicio oficial de la Revolución Cultural Proletaria en la China de Mao Zedong\". Ni una paradoja a la vista. Por ahora."
  },
  {
    "id": 535,
    "titulo": "Guerra de los Seis Días entre Israel y una coalición de países árabes",
    "anio": 1967,
    "descripcion": "Susurro del pasado captado por los sensores: \"Guerra de los Seis Días entre Israel y una coalición de países árabes\". Archívalo antes de que el café se enfríe."
  },
  {
    "id": 536,
    "titulo": "Oleada de protestas estudiantiles y obreras conocida como el Mayo Francés en París",
    "anio": 1968,
    "descripcion": "El oráculo temporal certifica: \"Oleada de protestas estudiantiles y obreras conocida como el Mayo Francés en París\". Esto sí que pasó, no como lo del becario y la aspiradora."
  },
  {
    "id": 537,
    "titulo": "Misión Apolo 11 llega a la Luna y Neil Armstrong se convierte en el primer hombre en pisarla",
    "anio": 1969,
    "descripcion": "Pieza recuperada del suelo de la sala del Cronolito: \"Misión Apolo 11 llega a la Luna y Neil Armstrong se convierte en el primer hombre en pisarla\". Un poco de polvo, pero intacta."
  },
  {
    "id": 538,
    "titulo": "Firma de la tregua en Oriente Medio por el rey Hussein de Jordania y la OLP",
    "anio": 1970,
    "descripcion": "Consulta al archivo maestro: \"Firma de la tregua en Oriente Medio por el rey Hussein de Jordania y la OLP\". Coincide con los registros oficiales de la Orden."
  },
  {
    "id": 539,
    "titulo": "El presidente Richard Nixon suspende la convertibilidad directa del dólar en oro",
    "anio": 1971,
    "descripcion": "Alerta de baja prioridad: \"El presidente Richard Nixon suspende la convertibilidad directa del dólar en oro\". Ni rastro de paradojas ni de becarios torpes en las cercanías."
  },
  {
    "id": 540,
    "titulo": "Atentado terrorista de Septiembre Negro en los Juegos Olímpicos de Múnich",
    "anio": 1972,
    "descripcion": "Registro del Cronolito: \"Atentado terrorista de Septiembre Negro en los Juegos Olímpicos de Múnich\". Los Arquitectos confirman que, efectivamente, esto pasó ANTES de que existiera el wifi."
  },
  {
    "id": 541,
    "titulo": "Golpe de Estado militar liderado por Augusto Pinochet derroca a Allende en Chile",
    "anio": 1973,
    "descripcion": "Nota del becario al margen: \"Golpe de Estado militar liderado por Augusto Pinochet derroca a Allende en Chile\". (Sigo sin encontrar el cable de la aspiradora, por cierto)."
  },
  {
    "id": 542,
    "titulo": "Dimisión del presidente estadounidense Richard Nixon por el escándalo Watergate",
    "anio": 1974,
    "descripcion": "Escaneo temporal completado: \"Dimisión del presidente estadounidense Richard Nixon por el escándalo Watergate\". Ningún dinosaurio fue visto grabando esto para TikTok. De momento."
  },
  {
    "id": 543,
    "titulo": "Fallecimiento del dictador Francisco Franco e inicio de la transición democrática en España",
    "anio": 1975,
    "descripcion": "Fragmento recuperado del Cronolito: \"Fallecimiento del dictador Francisco Franco e inicio de la transición democrática en España\". Coeficiente de paradoja: bajo. Se puede archivar sin pánico."
  },
  {
    "id": 544,
    "titulo": "Fallecimiento del líder comunista chino Mao Zedong en Pekín",
    "anio": 1976,
    "descripcion": "El sensor de coherencia temporal susurra: \"Fallecimiento del líder comunista chino Mao Zedong en Pekín\". Nada de esto debería sorprenderte, viajero."
  },
  {
    "id": 545,
    "titulo": "Primeras elecciones democráticas generales celebradas en España desde la República",
    "anio": 1977,
    "descripcion": "Bitácora de los Arquitectos del Tiempo: \"Primeras elecciones democráticas generales celebradas en España desde la República\". Otro ladrillo más en el muro de la Historia (con mayúscula)."
  },
  {
    "id": 546,
    "titulo": "Aprobación en referéndum popular de la actual Constitución Española",
    "anio": 1978,
    "descripcion": "Aviso desde el centro de control: \"Aprobación en referéndum popular de la actual Constitución Española\". Se ruega no tocar nada más, ya tuvimos suficiente con la aspiradora."
  },
  {
    "id": 547,
    "titulo": "Triunfo de la Revolución Islámica en Irán liderada por el ayatolá Jomeini",
    "anio": 1979,
    "descripcion": "Eco cronológico detectado: \"Triunfo de la Revolución Islámica en Irán liderada por el ayatolá Jomeini\". Verificado por triplicado — el tejido espacio-tiempo lo agradece."
  },
  {
    "id": 548,
    "titulo": "Asesinato del músico y exmiembro de los Beatles John Lennon en Nueva York",
    "anio": 1980,
    "descripcion": "El Cronolito parpadea y muestra: \"Asesinato del músico y exmiembro de los Beatles John Lennon en Nueva York\". Colócalo bien o la humanidad se queda sin wifi para siempre."
  },
  {
    "id": 549,
    "titulo": "Fracaso del intento de golpe de Estado del 23-F en el Congreso de los Diputados de España",
    "anio": 1981,
    "descripcion": "Informe de campo: \"Fracaso del intento de golpe de Estado del 23-F en el Congreso de los Diputados de España\". Ni una paradoja a la vista. Por ahora."
  },
  {
    "id": 550,
    "titulo": "Guerra de las Malvinas entre Argentina y el Reino Unido por la soberanía de las islas",
    "anio": 1982,
    "descripcion": "Susurro del pasado captado por los sensores: \"Guerra de las Malvinas entre Argentina y el Reino Unido por la soberanía de las islas\". Archívalo antes de que el café se enfríe."
  },
  {
    "id": 551,
    "titulo": "Presentación oficial del sistema operativo Windows por parte de Microsoft",
    "anio": 1983,
    "descripcion": "El oráculo temporal certifica: \"Presentación oficial del sistema operativo Windows por parte de Microsoft\". Esto sí que pasó, no como lo del becario y la aspiradora."
  },
  {
    "id": 552,
    "titulo": "Firma de la Declaración Conjunta Sino-Británica sobre el futuro de Hong Kong",
    "anio": 1984,
    "descripcion": "Pieza recuperada del suelo de la sala del Cronolito: \"Firma de la Declaración Conjunta Sino-Británica sobre el futuro de Hong Kong\". Un poco de polvo, pero intacta."
  },
  {
    "id": 553,
    "titulo": "Mijaíl Gorbachov asume el poder en la Unión Soviética iniciando la Perestroika",
    "anio": 1985,
    "descripcion": "Consulta al archivo maestro: \"Mijaíl Gorbachov asume el poder en la Unión Soviética iniciando la Perestroika\". Coincide con los registros oficiales de la Orden."
  },
  {
    "id": 554,
    "titulo": "Accidente nuclear catastrófico en la central de Chernóbil, Ucrania",
    "anio": 1986,
    "descripcion": "Alerta de baja prioridad: \"Accidente nuclear catastrófico en la central de Chernóbil, Ucrania\". Ni rastro de paradojas ni de becarios torpes en las cercanías."
  },
  {
    "id": 555,
    "titulo": "Firma del Tratado INF para la eliminación de misiles nucleares de corto y medio alcance",
    "anio": 1987,
    "descripcion": "Registro del Cronolito: \"Firma del Tratado INF para la eliminación de misiles nucleares de corto y medio alcance\". Los Arquitectos confirman que, efectivamente, esto pasó ANTES de que existiera el wifi."
  },
  {
    "id": 556,
    "titulo": "Masacre de la plaza de Tiananmén tras las protestas estudiantiles en Pekín",
    "anio": 1988,
    "descripcion": "Nota del becario al margen: \"Masacre de la plaza de Tiananmén tras las protestas estudiantiles en Pekín\". (Sigo sin encontrar el cable de la aspiradora, por cierto)."
  },
  {
    "id": 557,
    "titulo": "Caída del Muro de Berlín abriendo las fronteras entre las dos Alemanias",
    "anio": 1989,
    "descripcion": "Escaneo temporal completado: \"Caída del Muro de Berlín abriendo las fronteras entre las dos Alemanias\". Ningún dinosaurio fue visto grabando esto para TikTok. De momento."
  },
  {
    "id": 558,
    "titulo": "Reunificación oficial de Alemania tras cuarenta y cinco años de división separación",
    "anio": 1990,
    "descripcion": "Fragmento recuperado del Cronolito: \"Reunificación oficial de Alemania tras cuarenta y cinco años de división separación\". Coeficiente de paradoja: bajo. Se puede archivar sin pánico."
  },
  {
    "id": 559,
    "titulo": "Disolución jurídica formal de la Unión de Repúblicas Socialistas Soviéticas (URSS)",
    "anio": 1991,
    "descripcion": "El sensor de coherencia temporal susurra: \"Disolución jurídica formal de la Unión de Repúblicas Socialistas Soviéticas (URSS)\". Nada de esto debería sorprenderte, viajero."
  },
  {
    "id": 560,
    "titulo": "Firma del Tratado de Maastricht que sienta las bases de la Unión Europea",
    "anio": 1992,
    "descripcion": "Bitácora de los Arquitectos del Tiempo: \"Firma del Tratado de Maastricht que sienta las bases de la Unión Europea\". Otro ladrillo más en el muro de la Historia (con mayúscula)."
  },
  {
    "id": 561,
    "titulo": "Entrada en vigor del Tratado de Libre Comercio de América del Norte (TLCAN)",
    "anio": 1993,
    "descripcion": "Aviso desde el centro de control: \"Entrada en vigor del Tratado de Libre Comercio de América del Norte (TLCAN)\". Se ruega no tocar nada más, ya tuvimos suficiente con la aspiradora."
  },
  {
    "id": 562,
    "titulo": "Celebración de las primeras elecciones multirraciales con victoria de Mandela en Sudáfrica",
    "anio": 1994,
    "descripcion": "Eco cronológico detectado: \"Celebración de las primeras elecciones multirraciales con victoria de Mandela en Sudáfrica\". Verificado por triplicado — el tejido espacio-tiempo lo agradece."
  },
  {
    "id": 563,
    "titulo": "Entrada en funcionamiento de la Organización Mundial del Comercio (OMC)",
    "anio": 1995,
    "descripcion": "El Cronolito parpadea y muestra: \"Entrada en funcionamiento de la Organización Mundial del Comercio (OMC)\". Colócalo bien o la humanidad se queda sin wifi para siempre."
  },
  {
    "id": 564,
    "titulo": "Científicos del Instituto Roslin clonan con éxito al primer mamífero, la oveja Dolly",
    "anio": 1996,
    "descripcion": "Informe de campo: \"Científicos del Instituto Roslin clonan con éxito al primer mamífero, la oveja Dolly\". Ni una paradoja a la vista. Por ahora."
  },
  {
    "id": 565,
    "titulo": "Soberanía de Hong Kong es devuelta formalmente a China por el Reino Unido",
    "anio": 1997,
    "descripcion": "Susurro del pasado captado por los sensores: \"Soberanía de Hong Kong es devuelta formalmente a China por el Reino Unido\". Archívalo antes de que el café se enfríe."
  },
  {
    "id": 566,
    "titulo": "Firma del Acuerdo de Viernes Santo que pone fin al conflicto armado en Irlanda del Norte",
    "anio": 1998,
    "descripcion": "El oráculo temporal certifica: \"Firma del Acuerdo de Viernes Santo que pone fin al conflicto armado en Irlanda del Norte\". Esto sí que pasó, no como lo del becario y la aspiradora."
  },
  {
    "id": 567,
    "titulo": "Introducción oficial del euro como moneda de cuenta en once países de la Unión Europea",
    "anio": 1999,
    "descripcion": "Pieza recuperada del suelo de la sala del Cronolito: \"Introducción oficial del euro como moneda de cuenta en once países de la Unión Europea\". Un poco de polvo, pero intacta."
  },
  {
    "id": 568,
    "titulo": "Celebración del cambio de milenio global sin los fallos informáticos previstos del efecto Y2K",
    "anio": 2000,
    "descripcion": "Consulta al archivo maestro: \"Celebración del cambio de milenio global sin los fallos informáticos previstos del efecto Y2K\". Coincide con los registros oficiales de la Orden."
  },
  {
    "id": 569,
    "titulo": "Atentados terroristas del 11 de septiembre contra las Torres Gemelas y el Pentágono",
    "anio": 2001,
    "descripcion": "Alerta de baja prioridad: \"Atentados terroristas del 11 de septiembre contra las Torres Gemelas y el Pentágono\". Ni rastro de paradojas ni de becarios torpes en las cercanías."
  },
  {
    "id": 570,
    "titulo": "Entrada en circulación de los billetes y monedas de euro en los países de la Eurozona",
    "anio": 2002,
    "descripcion": "Registro del Cronolito: \"Entrada en circulación de los billetes y monedas de euro en los países de la Eurozona\". Los Arquitectos confirman que, efectivamente, esto pasó ANTES de que existiera el wifi."
  },
  {
    "id": 571,
    "titulo": "Invasión de Irak por una coalición liderada por los Estados Unidos de América",
    "anio": 2003,
    "descripcion": "Nota del becario al margen: \"Invasión de Irak por una coalición liderada por los Estados Unidos de América\". (Sigo sin encontrar el cable de la aspiradora, por cierto)."
  },
  {
    "id": 572,
    "titulo": "Atentados yihadistas del 11 de marzo en varias estaciones de tren de Madrid",
    "anio": 2004,
    "descripcion": "Escaneo temporal completado: \"Atentados yihadistas del 11 de marzo en varias estaciones de tren de Madrid\". Ningún dinosaurio fue visto grabando esto para TikTok. De momento."
  },
  {
    "id": 573,
    "titulo": "Fallecimiento del papa Juan Pablo II en la Ciudad del Vaticano",
    "anio": 2005,
    "descripcion": "Fragmento recuperado del Cronolito: \"Fallecimiento del papa Juan Pablo II en la Ciudad del Vaticano\". Coeficiente de paradoja: bajo. Se puede archivar sin pánico."
  },
  {
    "id": 574,
    "titulo": "Ejecución en la horca del expresidente iraquí Sadam Huseín en Bagdad",
    "anio": 2006,
    "descripcion": "El sensor de coherencia temporal susurra: \"Ejecución en la horca del expresidente iraquí Sadam Huseín en Bagdad\". Nada de esto debería sorprenderte, viajero."
  },
  {
    "id": 575,
    "titulo": "Presentación comercial del primer iPhone por Apple revolucionando la telefonía celular",
    "anio": 2007,
    "descripcion": "Bitácora de los Arquitectos del Tiempo: \"Presentación comercial del primer iPhone por Apple revolucionando la telefonía celular\". Otro ladrillo más en el muro de la Historia (con mayúscula)."
  },
  {
    "id": 576,
    "titulo": "Quiebra del banco de inversión Lehman Brothers desencadenando una crisis financiera global",
    "anio": 2008,
    "descripcion": "Aviso desde el centro de control: \"Quiebra del banco de inversión Lehman Brothers desencadenando una crisis financiera global\". Se ruega no tocar nada más, ya tuvimos suficiente con la aspiradora."
  },
  {
    "id": 577,
    "titulo": "Toma de posesión de Barack Obama como el primer presidente afroamericano de EE.UU.",
    "anio": 2009,
    "descripcion": "Eco cronológico detectado: \"Toma de posesión de Barack Obama como el primer presidente afroamericano de EE.UU.\". Verificado por triplicado — el tejido espacio-tiempo lo agradece."
  },
  {
    "id": 578,
    "titulo": "Se produce un devastador terremoto en Haití que causa más de 300.000 muertes",
    "anio": 2010,
    "descripcion": "El Cronolito parpadea y muestra: \"Se produce un devastador terremoto en Haití que causa más de 300.000 muertes\". Colócalo bien o la humanidad se queda sin wifi para siempre."
  },
  {
    "id": 579,
    "titulo": "Inicio de las protestas de la Primavera Árabe en múltiples países de Oriente Medio",
    "anio": 2011,
    "descripcion": "Informe de campo: \"Inicio de las protestas de la Primavera Árabe en múltiples países de Oriente Medio\". Ni una paradoja a la vista. Por ahora."
  },
  {
    "id": 580,
    "titulo": "Científicos del CERN confirman el descubrimiento de la partícula elemental del Bosón de Higgs",
    "anio": 2012,
    "descripcion": "Susurro del pasado captado por los sensores: \"Científicos del CERN confirman el descubrimiento de la partícula elemental del Bosón de Higgs\". Archívalo antes de que el café se enfríe."
  },
  {
    "id": 581,
    "titulo": "Renuncia histórica del papa Benedicto XVI y posterior elección de Francisco",
    "anio": 2013,
    "descripcion": "El oráculo temporal certifica: \"Renuncia histórica del papa Benedicto XVI y posterior elección de Francisco\". Esto sí que pasó, no como lo del becario y la aspiradora."
  },
  {
    "id": 582,
    "titulo": "Abdicación del rey Juan Carlos I de España y proclamación de Felipe VI",
    "anio": 2014,
    "descripcion": "Pieza recuperada del suelo de la sala del Cronolito: \"Abdicación del rey Juan Carlos I de España y proclamación de Felipe VI\". Un poco de polvo, pero intacta."
  },
  {
    "id": 583,
    "titulo": "Firma del Acuerdo de París sobre el cambio climático global en la COP21",
    "anio": 2015,
    "descripcion": "Consulta al archivo maestro: \"Firma del Acuerdo de París sobre el cambio climático global en la COP21\". Coincide con los registros oficiales de la Orden."
  },
  {
    "id": 584,
    "titulo": "Celebración del referéndum del Brexit con victoria de la salida del Reino Unido de la UE",
    "anio": 2016,
    "descripcion": "Alerta de baja prioridad: \"Celebración del referéndum del Brexit con victoria de la salida del Reino Unido de la UE\". Ni rastro de paradojas ni de becarios torpes en las cercanías."
  },
  {
    "id": 585,
    "titulo": "Declaración unilateral de independencia suspendida en el Parlamento de Cataluña",
    "anio": 2017,
    "descripcion": "Registro del Cronolito: \"Declaración unilateral de independencia suspendida en el Parlamento de Cataluña\". Los Arquitectos confirman que, efectivamente, esto pasó ANTES de que existiera el wifi."
  },
  {
    "id": 586,
    "titulo": "Histórica cumbre diplomática en Singapur entre Donald Trump y Kim Jong-un",
    "anio": 2018,
    "descripcion": "Nota del becario al margen: \"Histórica cumbre diplomática en Singapur entre Donald Trump y Kim Jong-un\". (Sigo sin encontrar el cable de la aspiradora, por cierto)."
  },
  {
    "id": 587,
    "titulo": "Incendio forestal masivo en la catedral de Notre Dame de París",
    "anio": 2019,
    "descripcion": "Escaneo temporal completado: \"Incendio forestal masivo en la catedral de Notre Dame de París\". Ningún dinosaurio fue visto grabando esto para TikTok. De momento."
  },
  {
    "id": 588,
    "titulo": "La OMS declara oficialmente la situación de pandemia global por la COVID-19",
    "anio": 2020,
    "descripcion": "Fragmento recuperado del Cronolito: \"La OMS declara oficialmente la situación de pandemia global por la COVID-19\". Coeficiente de paradoja: bajo. Se puede archivar sin pánico."
  },
  {
    "id": 589,
    "titulo": "Asalto violento de manifestantes partidarios de Trump al Capitolio de los Estados Unidos",
    "anio": 2021,
    "descripcion": "El sensor de coherencia temporal susurra: \"Asalto violento de manifestantes partidarios de Trump al Capitolio de los Estados Unidos\". Nada de esto debería sorprenderte, viajero."
  },
  {
    "id": 590,
    "titulo": "Inicio de la invasión militar a gran escala de Rusia en territorio de Ucrania",
    "anio": 2022,
    "descripcion": "Bitácora de los Arquitectos del Tiempo: \"Inicio de la invasión militar a gran escala de Rusia en territorio de Ucrania\". Otro ladrillo más en el muro de la Historia (con mayúscula)."
  },
  {
    "id": 591,
    "titulo": "Ataques de Hamás e inicio del conflicto armado a gran escala en la Franja de Gaza",
    "anio": 2023,
    "descripcion": "Aviso desde el centro de control: \"Ataques de Hamás e inicio del conflicto armado a gran escala en la Franja de Gaza\". Se ruega no tocar nada más, ya tuvimos suficiente con la aspiradora."
  },
  {
    "id": 592,
    "titulo": "Celebración de los Juegos Olímpicos de Verano en París",
    "anio": 2024,
    "descripcion": "Eco cronológico detectado: \"Celebración de los Juegos Olímpicos de Verano en París\". Verificado por triplicado — el tejido espacio-tiempo lo agradece."
  }
];
