-- ============================================================
-- SEED DATA - Anivex Veterinary App
-- Tablas: especies, razas, tipos_analisis
-- ============================================================

-- ============================================================
-- 1. ESPECIES
-- ============================================================
INSERT INTO public.especies (nombre) VALUES
  ('Perro'),
  ('Gato'),
  ('Conejo'),
  ('Ave'),
  ('Hámster'),
  ('Cobayo'),
  ('Chinchilla'),
  ('Hurón'),
  ('Tortuga'),
  ('Pez'),
  ('Reptil'),
  ('Rata'),
  ('Ratón'),
  ('Iguana'),
  ('Loro'),
  ('Otro');


-- ============================================================
-- 2. RAZAS DE PERRO
-- ============================================================
INSERT INTO public.razas (nombre, id_especie)
SELECT nombre, (SELECT id FROM public.especies WHERE nombre = 'Perro')
FROM (VALUES
  ('Labrador Retriever'),
  ('Golden Retriever'),
  ('Pastor Alemán'),
  ('Bulldog Francés'),
  ('Caniche / Poodle'),
  ('Beagle'),
  ('Rottweiler'),
  ('Yorkshire Terrier'),
  ('Dachshund / Teckel'),
  ('Chihuahua'),
  ('Boxer'),
  ('Shih Tzu'),
  ('Dobermann'),
  ('Husky Siberiano'),
  ('Maltés'),
  ('Pomeranio'),
  ('Schnauzer Miniatura'),
  ('Schnauzer Mediano'),
  ('Schnauzer Gigante'),
  ('Border Collie'),
  ('Pit Bull Terrier'),
  ('Bull Terrier'),
  ('Cocker Spaniel Inglés'),
  ('Cocker Spaniel Americano'),
  ('Gran Danés'),
  ('San Bernardo'),
  ('Bichón Frisé'),
  ('Shar Pei'),
  ('Dálmata'),
  ('Akita'),
  ('Pug / Carlino'),
  ('Weimaraner'),
  ('Jack Russell Terrier'),
  ('Cane Corso'),
  ('Mastín Napolitano'),
  ('Galgo'),
  ('Whippet'),
  ('Samoyedo'),
  ('Chow Chow'),
  ('Collie de Pelo Largo'),
  ('Pastor Australiano'),
  ('Setter Irlandés'),
  ('Bulldog Inglés'),
  ('Dogo Argentino'),
  ('Gran Pirineo'),
  ('Vizsla'),
  ('Cavalier King Charles Spaniel'),
  ('Corgi Galés de Pembroke'),
  ('American Bully'),
  ('American Staffordshire Terrier'),
  ('Basset Hound'),
  ('Bloodhound'),
  ('Bernés de la Montaña'),
  ('Bóxer'),
  ('Braco Alemán de Pelo Corto'),
  ('Bullmastiff'),
  ('Canaan Dog'),
  ('Chesapeake Bay Retriever'),
  ('Dogue de Bordeaux'),
  ('English Springer Spaniel'),
  ('Fila Brasileiro'),
  ('Flat-coated Retriever'),
  ('Fox Terrier de Pelo Liso'),
  ('Fox Terrier de Pelo Duro'),
  ('French Spaniel'),
  ('German Spitz'),
  ('Havanese'),
  ('Irish Wolfhound'),
  ('Italian Greyhound'),
  ('Japanese Spitz'),
  ('Keeshond'),
  ('Kerry Blue Terrier'),
  ('Komondor'),
  ('Kuvasz'),
  ('Leonberger'),
  ('Lhasa Apso'),
  ('Mallorquín / Ca de Bou'),
  ('Malinois Belga'),
  ('Mastín Español'),
  ('Mastín Inglés'),
  ('Montaña de los Pirineos'),
  ('Newfoundland'),
  ('Pekingés'),
  ('Perro Sin Pelo del Perú'),
  ('Pointer'),
  ('Puli'),
  ('Rhodesian Ridgeback'),
  ('Sabueso'),
  ('Saluki'),
  ('Scottish Terrier'),
  ('Shetland Sheepdog'),
  ('Shiba Inu'),
  ('Siberian Husky'),
  ('Soft Coated Wheaten Terrier'),
  ('Springer Spaniel'),
  ('Staffordshire Bull Terrier'),
  ('Terranova'),
  ('Tibetan Mastiff'),
  ('Tosa Inu'),
  ('Welsh Corgi Cardigan'),
  ('West Highland White Terrier'),
  ('Xoloitzcuintle'),
  ('Mestizo / Sin raza definida')
) AS t(nombre);


-- ============================================================
-- 3. RAZAS DE GATO
-- ============================================================
INSERT INTO public.razas (nombre, id_especie)
SELECT nombre, (SELECT id FROM public.especies WHERE nombre = 'Gato')
FROM (VALUES
  ('Persa Moderno'),
  ('Persa Tradicional'),
  ('Siamés'),
  ('Maine Coon'),
  ('Ragdoll'),
  ('Bengalí'),
  ('British Shorthair'),
  ('British Longhair'),
  ('Abisinio'),
  ('Sphynx'),
  ('Scottish Fold'),
  ('Scottish Straight'),
  ('Burmés'),
  ('Bosque de Noruega'),
  ('Angora Turco'),
  ('Azul Ruso'),
  ('Birmano'),
  ('Exótico de Pelo Corto'),
  ('Somali'),
  ('Devon Rex'),
  ('Cornish Rex'),
  ('Selkirk Rex'),
  ('Oriental de Pelo Corto'),
  ('Oriental de Pelo Largo'),
  ('Manx'),
  ('Munchkin'),
  ('Siberiano'),
  ('Savannah'),
  ('Ragamuffin'),
  ('Tonkinés'),
  ('Balinés'),
  ('Chartreux'),
  ('Himalayo'),
  ('Ocicat'),
  ('Peterbald'),
  ('Pixie-bob'),
  ('Singapura'),
  ('Snowshoe'),
  ('Turco Van'),
  ('LaPerm'),
  ('Lykoi'),
  ('Nebelung'),
  ('Minskin'),
  ('Australian Mist'),
  ('Europeo / Común Europeo'),
  ('Mestizo / Sin raza definida')
) AS t(nombre);


-- ============================================================
-- 4. RAZAS DE CONEJO
-- ============================================================
INSERT INTO public.razas (nombre, id_especie)
SELECT nombre, (SELECT id FROM public.especies WHERE nombre = 'Conejo')
FROM (VALUES
  ('Belier Francés'),
  ('Belier Enano'),
  ('Holland Lop'),
  ('Angora Francés'),
  ('Angora Inglés'),
  ('Rex'),
  ('Mini Rex'),
  ('Nueva Zelanda'),
  ('Californiano'),
  ('Gigante de Flandes'),
  ('Enano de Hotot'),
  ('Polaco'),
  ('Cabeza de León (Lionhead)'),
  ('Satin'),
  ('Plateado de Champagne'),
  ('Lobo de Alsacia'),
  ('Mariposa'),
  ('Leonado de Borgoña'),
  ('Chinchilla'),
  ('Inglés Manchado'),
  ('Mestizo / Sin raza definida')
) AS t(nombre);


-- ============================================================
-- 5. RAZAS DE AVE
-- ============================================================
INSERT INTO public.razas (nombre, id_especie)
SELECT nombre, (SELECT id FROM public.especies WHERE nombre = 'Ave')
FROM (VALUES
  ('Canario'),
  ('Periquito Australiano'),
  ('Agapornis (Inseparable)'),
  ('Ninfa / Cacatúa Ninfa'),
  ('Cacatúa de Cresta Amarilla'),
  ('Cacatúa de Moño'),
  ('Cacatúa Alba'),
  ('Loro Gris Africano'),
  ('Loro Amazona Frentiazul'),
  ('Loro Amazona Coroniamarilla'),
  ('Loro Eclectus'),
  ('Guacamayo Azulamarillo'),
  ('Guacamayo Rojo'),
  ('Guacamayo Verdiamarillo'),
  ('Cotorra Argentina / Monk Parakeet'),
  ('Cotorra de Carolina (extinta)'),
  ('Loriketo Arcoíris'),
  ('Piquero / Jilguero'),
  ('Diamante Mandarín'),
  ('Diamante de Gould'),
  ('Bengalí'),
  ('Estornino'),
  ('Gallineta / Gallina Bantam'),
  ('Tórtola'),
  ('Paloma Doméstica'),
  ('Tucán'),
  ('Otra especie de ave')
) AS t(nombre);


-- ============================================================
-- 6. RAZAS DE HÁMSTER
-- ============================================================
INSERT INTO public.razas (nombre, id_especie)
SELECT nombre, (SELECT id FROM public.especies WHERE nombre = 'Hámster')
FROM (VALUES
  ('Sirio / Dorado'),
  ('Ruso Enano (Campbell)'),
  ('Ruso Enano (Winter White)'),
  ('Roborovski'),
  ('Chino'),
  ('Europeo'),
  ('Mestizo / Sin raza definida')
) AS t(nombre);


-- ============================================================
-- 7. RAZAS DE COBAYO / CUYOS
-- ============================================================
INSERT INTO public.razas (nombre, id_especie)
SELECT nombre, (SELECT id FROM public.especies WHERE nombre = 'Cobayo')
FROM (VALUES
  ('Pelo Corto (Americano)'),
  ('Peruana (Angora)'),
  ('Abisinio'),
  ('Teddy'),
  ('Coronado (Crested)'),
  ('Rex'),
  ('Satin'),
  ('Silkie / Sheltie'),
  ('Texel'),
  ('Mestizo / Sin raza definida')
) AS t(nombre);


-- ============================================================
-- 8. RAZAS DE CHINCHILLA
-- ============================================================
INSERT INTO public.razas (nombre, id_especie)
SELECT nombre, (SELECT id FROM public.especies WHERE nombre = 'Chinchilla')
FROM (VALUES
  ('Chinchilla de Cola Larga'),
  ('Chinchilla de Cola Corta'),
  ('Estándar Gris'),
  ('Beige'),
  ('Blanca'),
  ('Violeta'),
  ('Sapphire'),
  ('Ebony'),
  ('Mestizo / Sin raza definida')
) AS t(nombre);


-- ============================================================
-- 9. RAZAS DE HURÓN
-- ============================================================
INSERT INTO public.razas (nombre, id_especie)
SELECT nombre, (SELECT id FROM public.especies WHERE nombre = 'Hurón')
FROM (VALUES
  ('Europeo'),
  ('Albino'),
  ('Sable'),
  ('Polar / Blanco con ojos oscuros'),
  ('Chocolate Mitt'),
  ('Panda'),
  ('Blaze'),
  ('Mestizo / Sin raza definida')
) AS t(nombre);


-- ============================================================
-- 10. RAZAS DE TORTUGA
-- ============================================================
INSERT INTO public.razas (nombre, id_especie)
SELECT nombre, (SELECT id FROM public.especies WHERE nombre = 'Tortuga')
FROM (VALUES
  ('Tortuga de Orejas Rojas (Trachemys scripta)'),
  ('Tortuga Mediterránea (Testudo hermanni)'),
  ('Tortuga de Hermann'),
  ('Tortuga de Tierra Sulcata'),
  ('Tortuga Estrellada'),
  ('Tortuga Caja (Box Turtle)'),
  ('Tortuga Rusa (Testudo horsfieldii)'),
  ('Tortuga Pintada (Painted Turtle)'),
  ('Tortuga de Tierra Griega'),
  ('Tortuga de Agua Dulce'),
  ('Otra especie de tortuga')
) AS t(nombre);


-- ============================================================
-- 11. RAZAS DE IGUANA
-- ============================================================
INSERT INTO public.razas (nombre, id_especie)
SELECT nombre, (SELECT id FROM public.especies WHERE nombre = 'Iguana')
FROM (VALUES
  ('Iguana Verde (Iguana iguana)'),
  ('Iguana Azul (Ctenosaura similis)'),
  ('Iguana del Desierto'),
  ('Iguana de Roca'),
  ('Otra iguana')
) AS t(nombre);


-- ============================================================
-- 12. RAZAS DE REPTIL (no iguana ni tortuga)
-- ============================================================
INSERT INTO public.razas (nombre, id_especie)
SELECT nombre, (SELECT id FROM public.especies WHERE nombre = 'Reptil')
FROM (VALUES
  ('Dragón Barbudo (Pogona vitticeps)'),
  ('Gecko Leopardo (Eublepharis macularius)'),
  ('Gecko de Cola Gorda (Hemitheconyx caudicinctus)'),
  ('Gecko Crested (Correlophus ciliatus)'),
  ('Camaleón Velado'),
  ('Camaleón de Jackson'),
  ('Boa Constrictor'),
  ('Boa Arco Iris'),
  ('Pitón Real (Ball Python)'),
  ('Pitón Bola Albina'),
  ('Pitón de Sangre'),
  ('Serpiente del Maíz (Corn Snake)'),
  ('Serpiente Rey'),
  ('Serpiente Ratón (Rat Snake)'),
  ('Varano / Monitor'),
  ('Skink de Lengua Azul'),
  ('Anolis'),
  ('Gecko Tokay'),
  ('Otro reptil')
) AS t(nombre);


-- ============================================================
-- 13. RAZAS DE LORO
-- ============================================================
INSERT INTO public.razas (nombre, id_especie)
SELECT nombre, (SELECT id FROM public.especies WHERE nombre = 'Loro')
FROM (VALUES
  ('Loro Gris Africano (Psittacus erithacus)'),
  ('Loro Amazona de Frente Azul'),
  ('Loro Amazona de Corona Amarilla'),
  ('Loro Amazona Mexicana'),
  ('Guacamayo Azulamarillo (Ara ararauna)'),
  ('Guacamayo Rojo (Ara macao)'),
  ('Guacamayo Escarlata'),
  ('Guacamayo Menor (Ara severa)'),
  ('Cacatúa de Moño (Cacatua galerita)'),
  ('Cacatúa Rosa (Eolophus roseicapilla – Galah)'),
  ('Loriketo Arcoíris'),
  ('Eclectus'),
  ('Poicephalus (Senegalés)'),
  ('Cotorra de Alejandría'),
  ('Periquito de Alejandría'),
  ('Loro Lori'),
  ('Loro de Sun Conure'),
  ('Loro de Jenday Conure'),
  ('Loro de Green Cheek Conure'),
  ('Otro loro / papagayo')
) AS t(nombre);


-- ============================================================
-- 14. RAZAS DE PEZ
-- ============================================================
INSERT INTO public.razas (nombre, id_especie)
SELECT nombre, (SELECT id FROM public.especies WHERE nombre = 'Pez')
FROM (VALUES
  ('Goldfish / Pez Dorado'),
  ('Koi'),
  ('Betta / Pez Luchador'),
  ('Guppy'),
  ('Tetra Neón'),
  ('Pez Ángel / Escalar'),
  ('Disco (Discus)'),
  ('Cíclido'),
  ('Platy'),
  ('Molly'),
  ('Espada (Xiphophorus hellerii)'),
  ('Pez Globo (Puffer)'),
  ('Pez Payaso (Clownfish)'),
  ('Pez Cirujano (Tang)'),
  ('Tilapia'),
  ('Salmón'),
  ('Truchas'),
  ('Otro pez de agua dulce'),
  ('Otro pez de agua salada')
) AS t(nombre);


-- ============================================================
-- 15. RAZAS DE RATA
-- ============================================================
INSERT INTO public.razas (nombre, id_especie)
SELECT nombre, (SELECT id FROM public.especies WHERE nombre = 'Rata')
FROM (VALUES
  ('Rata de Laboratorio (Rattus norvegicus)'),
  ('Rata Dumbo'),
  ('Rata Rex'),
  ('Rata Capucha (Hooded)'),
  ('Rata Berkshire'),
  ('Rata Moteada (Spotted)'),
  ('Rata Siamesa'),
  ('Rata Albina'),
  ('Otra rata doméstica')
) AS t(nombre);


-- ============================================================
-- 16. RAZAS DE RATÓN
-- ============================================================
INSERT INTO public.razas (nombre, id_especie)
SELECT nombre, (SELECT id FROM public.especies WHERE nombre = 'Ratón')
FROM (VALUES
  ('Ratón Doméstico (Mus musculus)'),
  ('Ratón Rex'),
  ('Ratón Largo (Fancy Mouse)'),
  ('Ratón Albino'),
  ('Ratón Pelado (Hairless)'),
  ('Ratón Sputnik (Angora)'),
  ('Otro ratón doméstico')
) AS t(nombre);


-- ============================================================
-- 17. RAZAS "OTRO"
-- ============================================================
INSERT INTO public.razas (nombre, id_especie)
SELECT nombre, (SELECT id FROM public.especies WHERE nombre = 'Otro')
FROM (VALUES
  ('Especie no listada / Exótica'),
  ('Marsupial (Zarigüeya, Equidna, etc.)'),
  ('Primate pequeño'),
  ('Cerdo de Guinea'),
  ('Mapache'),
  ('Zorra'),
  ('Otro animal doméstico')
) AS t(nombre);


-- ============================================================
-- 18. TIPOS DE ANÁLISIS
-- ============================================================
INSERT INTO public.tipos_analisis (nombre, descripcion) VALUES
  -- Hematología
  ('Hemograma completo (CBC)',       'Recuento y morfología de eritrocitos, leucocitos y plaquetas'),
  ('Frotis sanguíneo',               'Evaluación morfológica diferencial de células sanguíneas en extensión teñida'),
  ('Reticulocitos',                  'Recuento de eritrocitos inmaduros para evaluación de anemias regenerativas'),
  ('Prueba de Coombs (DAT)',         'Detección de anticuerpos sobre eritrocitos; diagnóstico de AHIM'),
  ('Grupo sanguíneo',                'Tipificación del grupo sanguíneo del paciente'),

  -- Bioquímica
  ('Bioquímica sanguínea básica',    'Glucosa, BUN, creatinina, ALT, FA, proteínas totales, albúmina, bilirrubina'),
  ('Perfil hepático',                'ALT, AST, GGT, FA, Bilirrubina total/directa, Proteínas totales, Albúmina'),
  ('Perfil renal',                   'Creatinina, BUN/Urea, Fósforo, Potasio, Sodio, Cloro, Calcio'),
  ('Perfil lipídico',                'Colesterol total, Triglicéridos, HDL, LDL'),
  ('Glucosa en sangre',              'Medición puntual de glucemia; útil en diabetes y emergencias'),
  ('Lactato plasmático',             'Marcador de hipoperfusión tisular y shock'),
  ('Amilasa y lipasa',               'Enzimas pancreáticas para diagnóstico de pancreatitis'),
  ('Lipasa pancreática específica (cPL/fPL)', 'Prueba específica para pancreatitis canina / felina'),
  ('Electroforesis de proteínas',    'Fraccionamiento de proteínas séricas (albúmina, alfa, beta, gamma)'),
  ('Proteína C reactiva (PCR)',      'Marcador de inflamación sistémica aguda'),
  ('Ionograma / Electrolitos',       'Sodio, Potasio, Cloro, Calcio iónico, Fósforo, Magnesio'),

  -- Endocrinología
  ('Perfil tiroideo (T4 total)',      'Tiroxina total; detección de hipotiroidismo / hipertiroidismo'),
  ('Perfil tiroideo completo (T4L, T3, TSH)', 'T4 libre, T3, TSH canina; diagnóstico diferencial de tiroidopatías'),
  ('Cortisol basal',                  'Basal pre-estimulación; screening de hiperadrenocorticismo'),
  ('Estimulación con ACTH (Cortisol post)', 'Diferenciación hipoadrenocorticismo / hiperadrenocorticismo'),
  ('Prueba de supresión con dexametasona (LDDS/HDDS)', 'Diferenciación etiología ACTH-dependiente vs independiente'),
  ('Insulina / Índice insulina-glucosa', 'Diagnóstico de insulinoma y diabetes mellitus'),
  ('Progesterona sérica',            'Seguimiento del ciclo reproductivo y ovulación'),
  ('Testosterona',                   'Evaluación del estatus reproductivo en machos'),

  -- Urianálisis
  ('Urianálisis completo',           'Evaluación física, química (tiras reactivas) y sedimento urinario'),
  ('Cultivo de orina (urocultivo)',  'Identificación bacteriana e antibiograma de infecciones urinarias'),
  ('Cociente proteína/creatinina urinaria (UPC)', 'Diagnóstico y seguimiento de proteinuria renal'),
  ('Densidad urinaria',              'Evaluación de la capacidad de concentración renal'),

  -- Coprología / Parasitología
  ('Examen coprológico / Coprograma','Análisis físico, microscopía directa y flotación fecal para parásitos'),
  ('Flotación fecal (Baermann)',     'Técnica de concentración para larvas de nematodos'),
  ('Test rápido de Giardia fecal',   'Detección de antígenos de Giardia en heces'),
  ('Cultivo fecal / Coprocultivo',   'Aislamiento bacterianos enteropatógenos (Salmonella, Campylobacter)'),
  ('PCR para parásitos gastrointestinales', 'Detección molecular de Giardia, Cryptosporidium, etc.'),

  -- Microbiología
  ('Cultivo bacteriológico general', 'Aislamiento e identificación bacteriana en muestra clínica'),
  ('Antibiograma (disco-difusión)',   'Perfil de sensibilidad antimicrobiana por método Kirby-Bauer'),
  ('Antibiograma (CMI / VITEK)',     'Concentración mínima inhibitoria mediante sistema automatizado'),
  ('Cultivo fúngico / Dermatofitosis','Identificación de hongos dermatofitos (DTM, cultivo Sabouraud)'),
  ('Cultivo micobacterias',          'Aislamiento de Mycobacterium spp.'),

  -- Citología e Histopatología
  ('Citología (PAAF)',               'Punción aspiración con aguja fina para análisis citológico'),
  ('Citología vaginal',              'Evaluación del ciclo estral por citología exfoliativa vaginal'),
  ('Citología ótica',                'Microscopía de exudado auricular para identificar agentes causales'),
  ('Citología cutánea',              'Estudio de improntas o raspados cutáneos'),
  ('Biopsia / Histopatología',       'Análisis microscópico de tejido incluido en parafina (HE y especiales)'),
  ('Inmunohistoquímica',             'Identificación de marcadores moleculares en tejido (oncología)'),
  ('Necropsia / Anatomopatología',   'Estudio macroscópico y microscópico post-mortem'),

  -- Dermatología
  ('Raspado cutáneo profundo',       'Diagnóstico de ácaros dérmicos (Demodex, Sarcoptes)'),
  ('Raspado cutáneo superficial',    'Identificación de Cheyletiella y otros ectoparásitos superficiales'),
  ('Tricograma',                     'Evaluación microscópica de ciclo piloso y morfología del pelo'),
  ('Lámpara de Wood',                'Fluorescencia UV para screening de Microsporum canis'),
  ('Test de hipersensibilidad intradérmica', 'Identificación de alérgenos específicos (atopia)'),
  ('Serologías para alergia (IgE específica)', 'Panel de alérgenos ambientales/alimentarios en suero'),

  -- Diagnóstico molecular (PCR)
  ('PCR Moquillo canino (CDV)',      'Detección molecular del virus del Distemper canino'),
  ('PCR Parvovirus canino (CPV)',    'Detección molecular del Parvovirus canino'),
  ('PCR Leptospira spp.',            'Detección molecular de Leptospira en orina o sangre'),
  ('PCR Leishmania spp.',            'Detección molecular de Leishmania en médula ósea, bazo o piel'),
  ('PCR Ehrlichia / Anaplasma',      'Detección molecular de rickettsias transmitidas por garrapatas'),
  ('PCR Borrelia burgdorferi',       'Detección molecular de Borrelia (Enfermedad de Lyme)'),
  ('PCR Herpesvirus felino (FHV-1)', 'Detección molecular del Herpesvirus felino'),
  ('PCR Calicivirus felino (FCV)',   'Detección molecular del Calicivirus felino'),
  ('PCR Coronavirus felino (FCoV/FIP)', 'Detección y diferenciación del Coronavirus felino (SEPN)'),
  ('PCR Bartonella spp.',            'Detección molecular de Bartonella (enfermedad del arañazo)'),
  ('PCR Toxoplasma gondii',          'Detección molecular de Toxoplasma'),
  ('PCR Mycoplasma / Hemoplasma',    'Detección molecular de hemoplasmas felinos/caninos'),

  -- Serología / Tests rápidos
  ('Test rápido FeLV / FIV (Snap)',  'Detección de antígenos FeLV y anticuerpos FIV en sangre periférica'),
  ('Test rápido Parvovirus fecal',   'Detección de antígenos de Parvovirus canino en heces'),
  ('Test rápido Giardia / Parvovirus combo', 'Test combinado antígenos Giardia + Parvovirus'),
  ('Serología Leishmania (DAT / IFAT / ELISA)', 'Detección de anticuerpos anti-Leishmania'),
  ('Serología Brucella canis',       'Detección de anticuerpos contra Brucella canis'),
  ('Serología Toxoplasma (IgG/IgM)', 'Detección de anticuerpos anti-Toxoplasma'),
  ('Panel de Ehrlichia / Anaplasma (4Dx)', 'Test 4Dx: Dirofilaria, Ehrlichia, Anaplasma, Borrelia'),
  ('Test de Dirofilaria (Heartworm)',  'Detección de antígenos de Dirofilaria immitis en sangre'),

  -- Coagulación
  ('Tiempo de protrombina (TP)',      'Evaluación de la vía extrínseca de la coagulación'),
  ('Tiempo de tromboplastina parcial activada (TTPA)', 'Evaluación de la vía intrínseca'),
  ('Fibrinógeno',                    'Proteína de fase aguda; marcador de coagulación y actividad inflamatoria'),
  ('D-dímeros',                      'Productos de degradación de la fibrina; sospecha de CID o tromboembolismo'),
  ('Tiempo de sangrado bucal',       'Evaluación de la hemostasia primaria / función plaquetaria'),

  -- Diagnóstico por imagen (clínicamente relacionados)
  ('Radiografía (Rx)',               'Diagnóstico por imagen con rayos X; torax, abdomen, huesos, cráneo'),
  ('Ecografía abdominal (US)',       'Evaluación por ultrasonido de órganos abdominales'),
  ('Ecocardiografía',                'Evaluación estructural y funcional del corazón por ultrasonido'),
  ('Endoscopia',                     'Visualización directa de cavidades (gastrointestinal, respiratoria)'),
  ('TAC / Tomografía computarizada', 'Imagen por cortes transversales con rayos X; neurología, oncología'),
  ('Resonancia Magnética (RM)',      'Imagen por campo magnético; sistema nervioso central y musculoesquelético'),

  -- Análisis de fluidos
  ('Análisis de líquido cefalorraquídeo (LCR)', 'Color, celularidad, proteínas y glucosa del LCR'),
  ('Análisis de líquido articular (sinovial)', 'Recuento celular, viscosidad y microscopía'),
  ('Análisis de líquido pleural',    'Trasudado vs exudado; citología e identificación bacteriana'),
  ('Análisis de líquido ascítico (peritoneal)', 'Trasudado vs exudado; detección de hemoperitoneo, uriabdomen'),
  ('Análisis de líquido pericárdico','Citología y cultivo del líquido pericárdico'),

  -- Otros
  ('Tensión arterial (método Doppler / oscilométrico)', 'Medición de presión arterial sistémica'),
  ('Gasometría / Gases en sangre',   'PO2, PCO2, pH, HCO3, BE; evaluación del equilibrio ácido-base'),
  ('Medición de presión intraocular', 'Tonometría; diagnóstico de glaucoma'),
  ('Test de Schirmer',               'Medición de producción lagrimal; diagnóstico de KCS'),
  ('Citología conjuntival',          'Evaluación de células conjuntivales; diagnóstico de queratoconjuntivitis'),
  ('Panel nutricional / Deficiencias', 'Vitamina B12, folato, cobalamina; evaluación de absorción intestinal');
