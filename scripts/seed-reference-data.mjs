/**
 * Script para poblar tablas de referencia en Supabase:
 * tipos_analisis, tipos_cirugia, tipos_vacuna, especies, razas
 *
 * Uso: node scripts/seed-reference-data.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://nzooctdomjsqfvgdyafx.supabase.co'

// Usa la service role key para saltear RLS en seed
// Conseguila en: https://supabase.com/dashboard/project/nzooctdomjsqfvgdyafx/settings/api
// Sección: Project API keys → service_role (secret)
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'PEGA_AQUI_LA_SERVICE_ROLE_KEY'

if (SUPABASE_KEY === 'PEGA_AQUI_LA_SERVICE_ROLE_KEY') {
  console.error('ERROR: Falta la service role key.')
  console.error('Conseguila en: https://supabase.com/dashboard/project/nzooctdomjsqfvgdyafx/settings/api')
  console.error('Luego ejecutá: $env:SUPABASE_SERVICE_ROLE_KEY="tu_key"; node scripts/seed-reference-data.mjs')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── TIPOS DE ANÁLISIS ──────────────────────────────────────────────────────────
const TIPOS_ANALISIS = [
  // Hematología
  { nombre: 'Hemograma completo (CBC)', descripcion: 'Recuento y morfología de eritrocitos, leucocitos y plaquetas' },
  { nombre: 'Frotis sanguíneo', descripcion: 'Evaluación morfológica diferencial de células sanguíneas en extensión teñida' },
  { nombre: 'Reticulocitos', descripcion: 'Recuento de eritrocitos inmaduros para evaluación de anemias regenerativas' },
  { nombre: 'Prueba de Coombs (DAT)', descripcion: 'Detección de anticuerpos sobre eritrocitos; diagnóstico de AHIM' },
  { nombre: 'Grupo sanguíneo', descripcion: 'Tipificación del grupo sanguíneo del paciente' },
  // Bioquímica
  { nombre: 'Bioquímica sanguínea básica', descripcion: 'Glucosa, BUN, creatinina, ALT, FA, proteínas totales, albúmina, bilirrubina' },
  { nombre: 'Perfil hepático', descripcion: 'ALT, AST, GGT, FA, Bilirrubina total/directa, Proteínas totales, Albúmina' },
  { nombre: 'Perfil renal', descripcion: 'Creatinina, BUN/Urea, Fósforo, Potasio, Sodio, Cloro, Calcio' },
  { nombre: 'Perfil lipídico', descripcion: 'Colesterol total, Triglicéridos, HDL, LDL' },
  { nombre: 'Glucosa en sangre', descripcion: 'Medición puntual de glucemia; útil en diabetes y emergencias' },
  { nombre: 'Lactato plasmático', descripcion: 'Marcador de hipoperfusión tisular y shock' },
  { nombre: 'Amilasa y lipasa', descripcion: 'Enzimas pancreáticas para diagnóstico de pancreatitis' },
  { nombre: 'Lipasa pancreática específica (cPL/fPL)', descripcion: 'Prueba específica para pancreatitis canina / felina' },
  { nombre: 'Electroforesis de proteínas', descripcion: 'Fraccionamiento de proteínas séricas (albúmina, alfa, beta, gamma)' },
  { nombre: 'Proteína C reactiva (PCR)', descripcion: 'Marcador de inflamación sistémica aguda' },
  { nombre: 'Ionograma / Electrolitos', descripcion: 'Sodio, Potasio, Cloro, Calcio iónico, Fósforo, Magnesio' },
  // Endocrinología
  { nombre: 'Perfil tiroideo (T4 total)', descripcion: 'Tiroxina total; detección de hipotiroidismo / hipertiroidismo' },
  { nombre: 'Perfil tiroideo completo (T4L, T3, TSH)', descripcion: 'T4 libre, T3, TSH canina; diagnóstico diferencial de tiroidopatías' },
  { nombre: 'Cortisol basal', descripcion: 'Basal pre-estimulación; screening de hiperadrenocorticismo' },
  { nombre: 'Estimulación con ACTH (Cortisol post)', descripcion: 'Diferenciación hipoadrenocorticismo / hiperadrenocorticismo' },
  { nombre: 'Prueba de supresión con dexametasona (LDDS/HDDS)', descripcion: 'Diferenciación etiología ACTH-dependiente vs independiente' },
  { nombre: 'Insulina / Índice insulina-glucosa', descripcion: 'Diagnóstico de insulinoma y diabetes mellitus' },
  { nombre: 'Progesterona sérica', descripcion: 'Seguimiento del ciclo reproductivo y ovulación' },
  { nombre: 'Testosterona', descripcion: 'Evaluación del estatus reproductivo en machos' },
  // Urianálisis
  { nombre: 'Urianálisis completo', descripcion: 'Evaluación física, química (tiras reactivas) y sedimento urinario' },
  { nombre: 'Cultivo de orina (urocultivo)', descripcion: 'Identificación bacteriana e antibiograma de infecciones urinarias' },
  { nombre: 'Cociente proteína/creatinina urinaria (UPC)', descripcion: 'Diagnóstico y seguimiento de proteinuria renal' },
  { nombre: 'Densidad urinaria', descripcion: 'Evaluación de la capacidad de concentración renal' },
  // Coprología / Parasitología
  { nombre: 'Examen coprológico / Coprograma', descripcion: 'Análisis físico, microscopía directa y flotación fecal para parásitos' },
  { nombre: 'Flotación fecal (Baermann)', descripcion: 'Técnica de concentración para larvas de nematodos' },
  { nombre: 'Test rápido de Giardia fecal', descripcion: 'Detección de antígenos de Giardia en heces' },
  { nombre: 'Cultivo fecal / Coprocultivo', descripcion: 'Aislamiento bacterianos enteropatógenos (Salmonella, Campylobacter)' },
  { nombre: 'PCR para parásitos gastrointestinales', descripcion: 'Detección molecular de Giardia, Cryptosporidium, etc.' },
  // Microbiología
  { nombre: 'Cultivo bacteriológico general', descripcion: 'Aislamiento e identificación bacteriana en muestra clínica' },
  { nombre: 'Antibiograma (disco-difusión)', descripcion: 'Perfil de sensibilidad antimicrobiana por método Kirby-Bauer' },
  { nombre: 'Antibiograma (CMI / VITEK)', descripcion: 'Concentración mínima inhibitoria mediante sistema automatizado' },
  { nombre: 'Cultivo fúngico / Dermatofitosis', descripcion: 'Identificación de hongos dermatofitos (DTM, cultivo Sabouraud)' },
  { nombre: 'Cultivo micobacterias', descripcion: 'Aislamiento de Mycobacterium spp.' },
  // Citología e Histopatología
  { nombre: 'Citología (PAAF)', descripcion: 'Punción aspiración con aguja fina para análisis citológico' },
  { nombre: 'Citología vaginal', descripcion: 'Evaluación del ciclo estral por citología exfoliativa vaginal' },
  { nombre: 'Citología ótica', descripcion: 'Microscopía de exudado auricular para identificar agentes causales' },
  { nombre: 'Citología cutánea', descripcion: 'Estudio de improntas o raspados cutáneos' },
  { nombre: 'Biopsia / Histopatología', descripcion: 'Análisis microscópico de tejido incluido en parafina (HE y especiales)' },
  { nombre: 'Inmunohistoquímica', descripcion: 'Identificación de marcadores moleculares en tejido (oncología)' },
  { nombre: 'Necropsia / Anatomopatología', descripcion: 'Estudio macroscópico y microscópico post-mortem' },
  // Dermatología
  { nombre: 'Raspado cutáneo profundo', descripcion: 'Diagnóstico de ácaros dérmicos (Demodex, Sarcoptes)' },
  { nombre: 'Raspado cutáneo superficial', descripcion: 'Identificación de Cheyletiella y otros ectoparásitos superficiales' },
  { nombre: 'Tricograma', descripcion: 'Evaluación microscópica de ciclo piloso y morfología del pelo' },
  { nombre: 'Lámpara de Wood', descripcion: 'Fluorescencia UV para screening de Microsporum canis' },
  { nombre: 'Test de hipersensibilidad intradérmica', descripcion: 'Identificación de alérgenos específicos (atopia)' },
  { nombre: 'Serologías para alergia (IgE específica)', descripcion: 'Panel de alérgenos ambientales/alimentarios en suero' },
  // Diagnóstico molecular (PCR)
  { nombre: 'PCR Moquillo canino (CDV)', descripcion: 'Detección molecular del virus del Distemper canino' },
  { nombre: 'PCR Parvovirus canino (CPV)', descripcion: 'Detección molecular del Parvovirus canino' },
  { nombre: 'PCR Leptospira spp.', descripcion: 'Detección molecular de Leptospira en orina o sangre' },
  { nombre: 'PCR Leishmania spp.', descripcion: 'Detección molecular de Leishmania en médula ósea, bazo o piel' },
  { nombre: 'PCR Ehrlichia / Anaplasma', descripcion: 'Detección molecular de rickettsias transmitidas por garrapatas' },
  { nombre: 'PCR Borrelia burgdorferi', descripcion: 'Detección molecular de Borrelia (Enfermedad de Lyme)' },
  { nombre: 'PCR Herpesvirus felino (FHV-1)', descripcion: 'Detección molecular del Herpesvirus felino' },
  { nombre: 'PCR Calicivirus felino (FCV)', descripcion: 'Detección molecular del Calicivirus felino' },
  { nombre: 'PCR Coronavirus felino (FCoV/FIP)', descripcion: 'Detección y diferenciación del Coronavirus felino (SEPN)' },
  { nombre: 'PCR Bartonella spp.', descripcion: 'Detección molecular de Bartonella (enfermedad del arañazo)' },
  { nombre: 'PCR Toxoplasma gondii', descripcion: 'Detección molecular de Toxoplasma' },
  { nombre: 'PCR Mycoplasma / Hemoplasma', descripcion: 'Detección molecular de hemoplasmas felinos/caninos' },
  // Serología / Tests rápidos
  { nombre: 'Test rápido FeLV / FIV (Snap)', descripcion: 'Detección de antígenos FeLV y anticuerpos FIV en sangre periférica' },
  { nombre: 'Test rápido Parvovirus fecal', descripcion: 'Detección de antígenos de Parvovirus canino en heces' },
  { nombre: 'Test rápido Giardia / Parvovirus combo', descripcion: 'Test combinado antígenos Giardia + Parvovirus' },
  { nombre: 'Serología Leishmania (DAT / IFAT / ELISA)', descripcion: 'Detección de anticuerpos anti-Leishmania' },
  { nombre: 'Serología Brucella canis', descripcion: 'Detección de anticuerpos contra Brucella canis' },
  { nombre: 'Serología Toxoplasma (IgG/IgM)', descripcion: 'Detección de anticuerpos anti-Toxoplasma' },
  { nombre: 'Panel de Ehrlichia / Anaplasma (4Dx)', descripcion: 'Test 4Dx: Dirofilaria, Ehrlichia, Anaplasma, Borrelia' },
  { nombre: 'Test de Dirofilaria (Heartworm)', descripcion: 'Detección de antígenos de Dirofilaria immitis en sangre' },
  // Coagulación
  { nombre: 'Tiempo de protrombina (TP)', descripcion: 'Evaluación de la vía extrínseca de la coagulación' },
  { nombre: 'Tiempo de tromboplastina parcial activada (TTPA)', descripcion: 'Evaluación de la vía intrínseca' },
  { nombre: 'Fibrinógeno', descripcion: 'Proteína de fase aguda; marcador de coagulación y actividad inflamatoria' },
  { nombre: 'D-dímeros', descripcion: 'Productos de degradación de la fibrina; sospecha de CID o tromboembolismo' },
  { nombre: 'Tiempo de sangrado bucal', descripcion: 'Evaluación de la hemostasia primaria / función plaquetaria' },
  // Diagnóstico por imagen
  { nombre: 'Radiografía (Rx)', descripcion: 'Diagnóstico por imagen con rayos X; tórax, abdomen, huesos, cráneo' },
  { nombre: 'Ecografía abdominal (US)', descripcion: 'Evaluación por ultrasonido de órganos abdominales' },
  { nombre: 'Ecocardiografía', descripcion: 'Evaluación estructural y funcional del corazón por ultrasonido' },
  { nombre: 'Endoscopia', descripcion: 'Visualización directa de cavidades (gastrointestinal, respiratoria)' },
  { nombre: 'TAC / Tomografía computarizada', descripcion: 'Imagen por cortes transversales con rayos X; neurología, oncología' },
  { nombre: 'Resonancia Magnética (RM)', descripcion: 'Imagen por campo magnético; sistema nervioso central y musculoesquelético' },
  // Análisis de fluidos
  { nombre: 'Análisis de líquido cefalorraquídeo (LCR)', descripcion: 'Color, celularidad, proteínas y glucosa del LCR' },
  { nombre: 'Análisis de líquido articular (sinovial)', descripcion: 'Recuento celular, viscosidad y microscopía' },
  { nombre: 'Análisis de líquido pleural', descripcion: 'Trasudado vs exudado; citología e identificación bacteriana' },
  { nombre: 'Análisis de líquido ascítico (peritoneal)', descripcion: 'Trasudado vs exudado; detección de hemoperitoneo, uriabdomen' },
  { nombre: 'Análisis de líquido pericárdico', descripcion: 'Citología y cultivo del líquido pericárdico' },
  // Otros
  { nombre: 'Tensión arterial (método Doppler / oscilométrico)', descripcion: 'Medición de presión arterial sistémica' },
  { nombre: 'Gasometría / Gases en sangre', descripcion: 'PO2, PCO2, pH, HCO3, BE; evaluación del equilibrio ácido-base' },
  { nombre: 'Medición de presión intraocular', descripcion: 'Tonometría; diagnóstico de glaucoma' },
  { nombre: 'Test de Schirmer', descripcion: 'Medición de producción lagrimal; diagnóstico de KCS' },
  { nombre: 'Citología conjuntival', descripcion: 'Evaluación de células conjuntivales; diagnóstico de queratoconjuntivitis' },
  { nombre: 'Panel nutricional / Deficiencias', descripcion: 'Vitamina B12, folato, cobalamina; evaluación de absorción intestinal' },
]

// ── TIPOS DE CIRUGÍA ───────────────────────────────────────────────────────────
const TIPOS_CIRUGIA = [
  { nombre: 'Ovariohisterectomía (OVH)', descripcion: 'Extirpación de ovarios y útero; esterilización hembra' },
  { nombre: 'Orquiectomía / Castración', descripcion: 'Extirpación de testículos; esterilización macho' },
  { nombre: 'Cesárea', descripcion: 'Extracción quirúrgica de cachorros/gatitos' },
  { nombre: 'Piometra (OVH de urgencia)', descripcion: 'Extirpación de útero con piometra' },
  { nombre: 'Esplenectomía', descripcion: 'Extirpación del bazo' },
  { nombre: 'Gastrectomía / Gastrotomía', descripcion: 'Cirugía gástrica (extirpación o apertura del estómago)' },
  { nombre: 'Enterotomía / Entorectomía', descripcion: 'Cirugía intestinal (apertura o resección)' },
  { nombre: 'Anastomosis intestinal', descripcion: 'Reconexión de segmentos intestinales' },
  { nombre: 'Resolución de dilatación-vólvulo gástrico (DVG)', descripcion: 'Cirugía de urgencia para GDV' },
  { nombre: 'Hepatectomía parcial', descripcion: 'Resección de lóbulo hepático' },
  { nombre: 'Colecistectomía', descripcion: 'Extirpación de la vesícula biliar' },
  { nombre: 'Pancreatectomía parcial', descripcion: 'Resección parcial de páncreas' },
  { nombre: 'Nefrectomía', descripcion: 'Extirpación de riñón' },
  { nombre: 'Cistotomía / Urolitos', descripcion: 'Apertura de vejiga para extracción de cálculos' },
  { nombre: 'Uretrostomía perineal (UPG)', descripcion: 'Creación de estoma uretral en gatos obstruidos' },
  { nombre: 'Prostatectomía / Prostatotomía', descripcion: 'Cirugía de próstata' },
  { nombre: 'Herniorrafia umbilical', descripcion: 'Corrección quirúrgica de hernia umbilical' },
  { nombre: 'Herniorrafia inguinal', descripcion: 'Corrección quirúrgica de hernia inguinal' },
  { nombre: 'Herniorrafia perineal', descripcion: 'Corrección quirúrgica de hernia perineal' },
  { nombre: 'Herniorrafia diafragmática', descripcion: 'Reparación de hernia diafragmática' },
  { nombre: 'Lobectomía pulmonar', descripcion: 'Resección de lóbulo pulmonar' },
  { nombre: 'Toracotomía exploratoria', descripcion: 'Apertura del tórax para exploración o drenaje' },
  { nombre: 'Pericardectomía', descripcion: 'Extirpación parcial del pericardio' },
  { nombre: 'Cirugía de ligamento cruzado craneal (TPLO/TTA)', descripcion: 'Estabilización de rodilla canina' },
  { nombre: 'Luxación de rótula (corrección quirúrgica)', descripcion: 'Trocleoplastia y transposición de tuberosidad tibial' },
  { nombre: 'Fijación de fracturas (placas / clavos / fijador externo)', descripcion: 'Osteosíntesis de fracturas' },
  { nombre: 'Amputación de miembro', descripcion: 'Extirpación de miembro torácico o pélvico' },
  { nombre: 'Amputación de cola', descripcion: 'Resección de la cola por traumatismo o neoplasia' },
  { nombre: 'Artroplastia de cadera (FHO)', descripcion: 'Remoción de la cabeza femoral' },
  { nombre: 'Artrodesis', descripcion: 'Fusión quirúrgica de articulación' },
  { nombre: 'Extirpación de tumor (masa de tejidos blandos)', descripcion: 'Escisión de neoplasia en piel/tejido subcutáneo' },
  { nombre: 'Mastectomía', descripcion: 'Extirpación de glándulas mamarias (parcial, unilateral o bilateral)' },
  { nombre: 'Extirpación de glándulas anales', descripcion: 'Sacculectomía por absceso, neoplasia o fístula perianal' },
  { nombre: 'Enucleación ocular', descripcion: 'Extirpación del globo ocular' },
  { nombre: 'Cirugía de párpado (entropión/ectropión)', descripcion: 'Corrección de inversión o eversión palpebral' },
  { nombre: 'Luxación del cristalino (extracción)', descripcion: 'Cirugía ocular por luxación primaria o secundaria' },
  { nombre: 'Palatoplastia (braquicéfalos)', descripcion: 'Corrección de paladar blando elongado y estenosis nasal' },
  { nombre: 'Traqueostomía de urgencia', descripcion: 'Apertura traqueal para vía aérea de emergencia' },
  { nombre: 'Saculectomía + drenaje de absceso', descripcion: 'Drenaje y extirpación de glándulas caudales infectadas' },
  { nombre: 'Cistopexia / Gastropexia profiláctica', descripcion: 'Fijación preventiva de estómago o vejiga' },
  { nombre: 'Exploratoria abdominal', descripcion: 'Laparotomía exploratoria sin procedimiento específico definido' },
  { nombre: 'Otra cirugía', descripcion: null },
]

// ── TIPOS DE VACUNA ────────────────────────────────────────────────────────────
const TIPOS_VACUNA = [
  { nombre: 'Séxtuple canina (DHPPiL)' },
  { nombre: 'Óctuple canina (DHPPi2L4)' },
  { nombre: 'Rabia' },
  { nombre: 'Bordetella bronchiseptica (tos de las perreras)' },
  { nombre: 'Gripe canina (Influenza canina H3N2/H3N8)' },
  { nombre: 'Triple felina (FVRCP)' },
  { nombre: 'FeLV (Leucemia felina)' },
  { nombre: 'FIV (Inmunodeficiencia felina)' },
  { nombre: 'Rabia (felinos)' },
  { nombre: 'Clamidiosis felina' },
  { nombre: 'Mixomatosis (conejos)' },
  { nombre: 'Enfermedad Hemorrágica Viral (VHD/RHD)' },
  { nombre: 'Combo Mixomatosis + VHD' },
  { nombre: 'Herpesvirus équido (EHV-1/4)' },
  { nombre: 'Leptospirosis específica (serovariedades)' },
  { nombre: 'Leishmaniosis canina (CaniLeish / Letifend)' },
  { nombre: 'Otra vacuna' },
]

// ── ESPECIES ───────────────────────────────────────────────────────────────────
const ESPECIES = [
  'Perro', 'Gato', 'Conejo', 'Ave', 'Hámster', 'Cobayo', 'Chinchilla',
  'Hurón', 'Tortuga', 'Pez', 'Reptil', 'Rata', 'Ratón', 'Iguana', 'Loro', 'Otro',
]

// ── RAZAS ──────────────────────────────────────────────────────────────────────
// Se insertan después de tener los IDs de especies
const RAZAS_POR_ESPECIE = {
  Perro: [
    'Labrador Retriever','Golden Retriever','Pastor Alemán','Bulldog Francés',
    'Caniche / Poodle','Beagle','Chihuahua','Yorkshire Terrier','Boxer',
    'Dachshund / Salchicha','Cocker Spaniel','Shih Tzu','Dobermann',
    'Rottweiler','Husky Siberiano','Schnauzer','Bichón Maltés','Border Collie',
    'Dálmata','Pomerania','Shar Pei','Bulldog Inglés','Pit Bull Terrier',
    'American Staffordshire','Jack Russell Terrier','Weimaraner','Setter Irlandés',
    'Basset Hound','Mastín Napolitano','Gran Danés','Samoyedo','Akita Inu',
    'Shiba Inu','Spitz Alemán','Pug / Carlino','Bernés de la Montaña',
    'Braco Alemán','Vizsla Húngaro','Whippet','Galgo Español','Afgano',
    'Maltés','Bichón Frisé','Pekinés','Lhasa Apso','Cairn Terrier',
    'Airedale Terrier','Bull Terrier','Fox Terrier','Teckel',
    'Mestizo / Sin raza definida',
  ],
  Gato: [
    'Europeo Común','Siamés','Persa','Maine Coon','Ragdoll','British Shorthair',
    'Scottish Fold','Bengalí','Sphynx / Sin pelo','Abisinio','Birmano',
    'Angora Turco','Ruso Azul','Norwegian Forest Cat','Savannah',
    'Devon Rex','Cornish Rex','Burmés','Oriental','Exótico de Pelo Corto',
    'Mestizo / Sin raza definida',
  ],
  Conejo: [
    'Holandés (Dutch)','Mini Rex','Angora Inglés','Angora Francés',
    'León (Lionhead)','Carnero Francés','Belier Enano','Rex',
    'Californiano','Nueva Zelanda','Sin raza definida',
  ],
  Ave: [
    'Canario','Periquito Australiano','Agapornis (Inseparable)','Ninfa / Cockatiel',
    'Cacatúa','Loro Gris Africano','Amazona','Ara / Guacamayo',
    'Cotorra Argentina','Eclecto','Pinzón Cebra','Paloma Doméstica',
    'Gallineta / Gallina ornamental','Diamond Dove','Otra ave',
  ],
  Hámster: ['Hámster Sirio (Dorado)','Hámster Ruso (Djungarian)','Hámster Chino','Roborovski'],
  Cobayo: ['Cobayo / Cuy (sin raza específica)', 'Cobayo Abisinio', 'Cobayo Peruvian'],
  Chinchilla: ['Chinchilla Estándar', 'Chinchilla de Mutación'],
  Hurón: ['Hurón Doméstico (sin color específico)', 'Hurón Albino', 'Hurón Sable'],
  Tortuga: ['Tortuga de Tierra Mediterránea','Tortuga de Caja','Tortuga de Agua Dulce','Tortuga Rusa'],
  Pez: ['Goldfish / Carpa Dorada','Koi','Betta / Pez Luchador','Disco','Sin especie específica'],
  Reptil: ['Iguana Verde','Dragón Barbudo','Camaleón','Serpiente Maíz','Boa Constrictora','Gecko Leopardo','Tortuga del Desierto'],
  Rata: ['Rata de Laboratorio (Rattus norvegicus)','Rata Dumbo','Rata Rex'],
  Ratón: ['Ratón Doméstico (Mus musculus)','Ratón Enano Africano'],
  Iguana: ['Iguana Verde (Iguana iguana)', 'Iguana del Desierto'],
  Loro: ['Loro Gris Africano','Amazona Frentiazul','Guacamayo Azulamarillo','Cotorra Alejandrina'],
  Otro: ['Sin especie/raza definida'],
}

// ── HELPERS ────────────────────────────────────────────────────────────────────
async function seedTable(table, rows) {
  // Solo insertar si la tabla está vacía
  const { count } = await sb.from(table).select('id', { count: 'exact', head: true })
  if (count > 0) {
    console.log(`  (ya tiene ${count} filas, se omite)`)
    return count
  }
  const CHUNK = 50
  let total = 0
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await sb.from(table).insert(rows.slice(i, i + CHUNK))
    if (error) { console.error(`  ✗ ${table}:`, error.message); return total }
    total += Math.min(CHUNK, rows.length - i)
  }
  return total
}

async function main() {
  console.log('Seeding Supabase reference tables...\n')

  // 1. Tipos de análisis
  process.stdout.write('tipos_analisis... ')
  console.log(await seedTable('tipos_analisis', TIPOS_ANALISIS) + ' rows')

  // 2. Tipos de cirugía
  process.stdout.write('tipos_cirugia... ')
  console.log(await seedTable('tipos_cirugia', TIPOS_CIRUGIA) + ' rows')

  // 3. Tipos de vacuna
  process.stdout.write('tipos_vacuna... ')
  console.log(await seedTable('tipos_vacuna', TIPOS_VACUNA) + ' rows')

  // 4. Especies
  process.stdout.write('especies... ')
  const { count: espCount } = await sb.from('especies').select('id', { count: 'exact', head: true })
  let especiesRows
  if (espCount > 0) {
    console.log(`  (ya tiene ${espCount} filas, se omite)`)
    const { data } = await sb.from('especies').select('id, nombre')
    especiesRows = data
  } else {
    const { data, error } = await sb.from('especies').insert(ESPECIES.map(n => ({ nombre: n }))).select('id, nombre')
    if (error) { console.error('✗', error.message); return }
    especiesRows = data
    console.log(especiesRows.length + ' rows')
  }

  // 5. Razas (necesita los IDs de especies)
  process.stdout.write('razas... ')
  const { count: razaCount } = await sb.from('razas').select('id', { count: 'exact', head: true })
  if (razaCount > 0) {
    console.log(`  (ya tiene ${razaCount} filas, se omite)`)
  } else {
    const especieMap = Object.fromEntries(especiesRows.map(e => [e.nombre, e.id]))
    const razasRows = []
    for (const [espNombre, razas] of Object.entries(RAZAS_POR_ESPECIE)) {
      const id_especie = especieMap[espNombre]
      if (!id_especie) { console.warn(`  (especie no encontrada: ${espNombre})`); continue }
      razas.forEach(nombre => razasRows.push({ nombre, id_especie }))
    }
    const CHUNK = 50
    let inserted = 0
    for (let i = 0; i < razasRows.length; i += CHUNK) {
      const { error } = await sb.from('razas').insert(razasRows.slice(i, i + CHUNK))
      if (error) { console.error('✗', error.message); break }
      inserted += Math.min(CHUNK, razasRows.length - i)
    }
    console.log(inserted + ' rows')
  }

  // Verificación final
  console.log('\nVerificando...')
  const tables = ['tipos_analisis', 'tipos_cirugia', 'tipos_vacuna', 'especies', 'razas']
  for (const t of tables) {
    const { count } = await sb.from(t).select('id', { count: 'exact', head: true })
    console.log(`  ${t}: ${count} filas`)
  }
  console.log('\nListo.')
}

main().catch(console.error)
