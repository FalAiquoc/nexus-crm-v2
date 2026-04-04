export const PRESET_THEMES = {
  'Ouro Negro': {
    'bg-main': '#0A0A0A',
    'bg-sidebar': '#121212',
    'bg-card': '#1A1A1A',
    'primary': '#D4AF37',
    'secondary': '#F3E5AB',
    'text-main': '#F0EAD6',
    'text-sec': '#9A9A9A',
    'border-color': '#2A2A2A',
    'grad-start': '#B8860B',
    'grad-end': '#D4AF37',
    'text-on-grad': '#0A0A0A'
  },
  'Azul Noturno': {
    'bg-main': '#0f171c',
    'bg-sidebar': '#151e23',
    'bg-card': '#1b252c',
    'primary': '#3b82f6',
    'secondary': '#60a5fa',
    'text-main': '#f8fafc',
    'text-sec': '#94a3b8',
    'border-color': '#2d3a43',
    'grad-start': '#1e293b',
    'grad-end': '#0f172a',
    'text-on-grad': '#f8fafc'
  },
  'Verde Sálvia': {
    'bg-main': '#1a2421',
    'bg-sidebar': '#24302c',
    'bg-card': '#2d3a35',
    'primary': '#10b981',
    'secondary': '#34d399',
    'text-main': '#f0fdf4',
    'text-sec': '#94a3b8',
    'border-color': '#374151',
    'grad-start': '#2d3a35',
    'grad-end': '#1a2421',
    'text-on-grad': '#f0fdf4'
  },
  'Vinho Clássico': {
    'bg-main': '#1a0f16',
    'bg-sidebar': '#251620',
    'bg-card': '#3a1f2e',
    'primary': '#ec4899',
    'secondary': '#f472b6',
    'text-main': '#fff1f2',
    'text-sec': '#94a3b8',
    'border-color': '#4c1d35',
    'grad-start': '#3a1f2e',
    'grad-end': '#1a0f16',
    'text-on-grad': '#fff1f2'
  },
  'Barber Classic': {
    'bg-main': '#F8FAFC',
    'bg-sidebar': '#1E3A8A',
    'bg-card': '#FFFFFF',
    'primary': '#EF4444',
    'secondary': '#2563EB',
    'text-main': '#1E293B',
    'text-sec': '#64748B',
    'border-color': '#E2E8F0',
    'grad-start': '#1E3A8A',
    'grad-end': '#EF4444',
    'text-on-grad': '#FFFFFF'
  },
  'Barber Dark': {
    'bg-main': '#0F172A',
    'bg-sidebar': '#1E293B',
    'bg-card': '#1E293B',
    'primary': '#EF4444',
    'secondary': '#38BDF8',
    'text-main': '#F8FAFC',
    'text-sec': '#94A3B8',
    'border-color': '#334155',
    'grad-start': '#EF4444',
    'grad-end': '#1E293B',
    'text-on-grad': '#F8FAFC'
  },
  'Modern Chrome': {
    'bg-main': '#E5E7EB',
    'bg-sidebar': '#374151',
    'bg-card': '#FFFFFF',
    'primary': '#1F2937',
    'secondary': '#EF4444',
    'text-main': '#111827',
    'text-sec': '#4B5563',
    'border-color': '#D1D5DB',
    'grad-start': '#374151',
    'grad-end': '#9CA3AF',
    'text-on-grad': '#FFFFFF'
  },
  'Luxury Barber': {
    'bg-main': '#0A0A0A',
    'bg-sidebar': '#1B263B',
    'bg-card': '#121212',
    'primary': '#D4AF37',
    'secondary': '#2563EB',
    'text-main': '#F0EAD6',
    'text-sec': '#9A9A9A',
    'border-color': '#1B263B',
    'grad-start': '#1B263B',
    'grad-end': '#2563EB',
    'text-on-grad': '#F0EAD6'
  }
};

export type ThemeName = keyof typeof PRESET_THEMES;
