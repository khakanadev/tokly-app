export const componentSections = [
  { id: 'vibration_damper', title: 'Виброгаситель', categoryId: 2140001 },
  { id: 'glass_garland', title: 'Гирлянда стекло', categoryId: 2150001 },
  { id: 'polymer_garland', title: 'Гирлянда полимер', categoryId: 2280011 },
  { id: 'travers', title: 'Траверс', categoryId: 2160001 },
  { id: 'isolator_minus', title: 'Изолятор-', categoryId: 2280000 },
  { id: 'isolator_plus', title: 'Изолятор+', categoryId: 2280001 },
  { id: 'nests', title: 'Гнезда', categoryId: 2220001 },
  { id: 'plates', title: 'Таблички', categoryId: 2270001 },
] as const

export const categoryClassMap: Record<string, number> = {
  vibration_damper: 2140001,
  festoon_insulators: 2150001,
  traverse: 2160001,
  nest: 2220001,
  'safety_sign+': 2270001,
  safety_sign: 2270001,
  bad_insulator: 2280000,
  damaged_insulator: 2280001,
  polymer_insulators: 2280011,
}

export const sectionClassMap: Record<string, string[]> = {
  vibration_damper: ['vibration_damper'],
  glass_garland: ['festoon_insulators'],
  polymer_garland: ['polymer_insulators'],
  travers: ['traverse'],
  isolator_minus: ['bad_insulator'],
  isolator_plus: ['damaged_insulator'],
  nests: ['nest'],
  plates: ['safety_sign+', 'safety_sign'],
}

