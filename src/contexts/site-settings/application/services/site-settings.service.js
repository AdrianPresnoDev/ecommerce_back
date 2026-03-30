// src/contexts/site-settings/application/services/site-settings.service.js
import { sequelize } from '../../../../interfaces/db/mysql-client.js';
import { presignPut, buildImageUrl } from '../../../../interfaces/aws/s3.service.js';
import { getS3Config } from '../../../../interfaces/aws/s3.service.js';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_ABOUT = {
  hero: {
    imageUrl: 'https://images.unsplash.com/photo-1752649936390-561408d22108?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    name: 'Inma Álvarez',
    subtitle: 'Pintora contemporánea. Transformando emociones en color y textura desde 2010.',
    location: 'Madrid, España',
    yearsExperience: '15+',
    worksCount: '500+',
  },
  quote: 'El arte no es solo lo que ves, sino lo que haces sentir a los demás. Cada pincelada es un puente entre mi alma y el mundo',
  story: {
    title: 'Mi Viaje Creativo',
    photos: ['', '', '', ''],
    paragraphs: [
      'Desde niña, los colores han sido mi lenguaje. Crecí rodeada de arte, observando cómo las emociones podían capturarse en un lienzo. Esta fascinación infantil se convirtió en mi profesión y mi propósito de vida.',
      'Estudié Bellas Artes en Madrid, donde descubrí que el arte contemporáneo no solo debía representar la realidad, sino interpretarla, cuestionarla y transformarla. Mi estilo nació de la fusión entre la técnica clásica que aprendí de los maestros y la libertad expresiva del arte moderno.',
      'Hoy, cada obra que creo es un diálogo entre mi visión interior y el mundo exterior. Trabajo con técnicas mixtas, combinando acrílico, óleo y materiales texturizados para crear piezas que inviten a la reflexión y despierten emociones auténticas.',
      'Mi mayor satisfacción es saber que mis obras viven en hogares, oficinas y espacios donde generan conversaciones, inspiran y acompañan a las personas en su día a día.',
    ],
  },
  values: [
    { title: 'Pasión Auténtica', description: 'Cada obra nace desde la emoción genuina y el compromiso total con el proceso creativo.' },
    { title: 'Innovación Constante', description: 'Experimento con nuevas técnicas y materiales para evolucionar constantemente mi expresión artística.' },
    { title: 'Conexión Humana', description: 'Creo arte que conecta con las personas, que genera conversaciones y despierta emociones.' },
  ],
  milestones: [
    { year: '2010', title: 'Los Inicios', description: 'Primera exposición individual en Madrid. Comencé mi viaje profesional en el mundo del arte contemporáneo.' },
    { year: '2014', title: 'Reconocimiento Internacional', description: 'Participación en la Bienal de Arte Contemporáneo de Barcelona. Primeros coleccionistas internacionales.' },
    { year: '2018', title: 'Evolución Artística', description: 'Desarrollo de mi técnica mixta característica. Inauguración de mi estudio personal en Madrid.' },
    { year: '2022', title: 'Expansión Digital', description: 'Lanzamiento de mi plataforma online. Conexión con coleccionistas de más de 20 países.' },
    { year: '2026', title: 'Nueva Era', description: 'Más de 500 obras creadas. Consolidación como referente del arte contemporáneo español.' },
  ],
  exhibitions: [
    { year: 2025, title: 'Colores del Alma', location: 'Museo Nacional de Arte, Madrid' },
    { year: 2024, title: 'Abstracción Contemporánea', location: 'Galería de Arte Moderno, Barcelona' },
    { year: 2023, title: 'Texturas Emocionales', location: 'Centro Cultural, Valencia' },
    { year: 2022, title: 'Expresiones Urbanas', location: 'Art Fair, Lisboa' },
  ],
};

export async function getSetting(key) {
  const { SiteSettings } = sequelize.models;
  const row = await SiteSettings.findByPk(key);
  if (!row) return null;
  try { return JSON.parse(row.value); } catch { return row.value; }
}

export async function setSetting(key, value) {
  const { SiteSettings } = sequelize.models;
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);
  await SiteSettings.upsert({ key, value: serialized });
  return value;
}

export async function getAboutPage() {
  const data = await getSetting('about_page');
  return data || DEFAULT_ABOUT;
}

export async function updateAboutPage(patch) {
  const current = await getAboutPage();
  // Deep merge top-level keys
  const merged = { ...current };
  for (const k of Object.keys(patch)) {
    if (patch[k] !== undefined) merged[k] = patch[k];
  }
  await setSetting('about_page', merged);
  return merged;
}

export async function getAboutImageUploadUrl(contentType = 'image/jpeg') {
  const { prefix } = getS3Config();
  const ext = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';
  const key = [prefix, 'about', `hero-${uuidv4()}.${ext}`].filter(Boolean).join('/');
  const uploadUrl = await presignPut({ key, contentType, expiresInSeconds: 600 });
  return { uploadUrl, key, imageUrl: buildImageUrl(key) };
}
