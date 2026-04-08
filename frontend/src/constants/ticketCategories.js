// Ticket Categories - matches backend enum
export const TICKET_CATEGORIES = {
  ELECTRICAL: 'ELECTRICAL',
  PLUMBING: 'PLUMBING',
  NETWORK: 'NETWORK',
  EQUIPMENT: 'EQUIPMENT',
  CLEANING: 'CLEANING',
  SECURITY: 'SECURITY',
  HVAC: 'HVAC',
  FURNITURE: 'FURNITURE',
  LIGHTING: 'LIGHTING',
  OTHER: 'OTHER'
};

// Category display names and colors
export const CATEGORY_CONFIG = {
  [TICKET_CATEGORIES.ELECTRICAL]: {
    label: 'Electrical',
    color: 'orange',
    icon: '⚡'
  },
  [TICKET_CATEGORIES.PLUMBING]: {
    label: 'Plumbing',
    color: 'blue',
    icon: '🚰'
  },
  [TICKET_CATEGORIES.NETWORK]: {
    label: 'Network',
    color: 'green',
    icon: '🌐'
  },
  [TICKET_CATEGORIES.EQUIPMENT]: {
    label: 'Equipment',
    color: 'purple',
    icon: '🖥️'
  },
  [TICKET_CATEGORIES.CLEANING]: {
    label: 'Cleaning',
    color: 'cyan',
    icon: '🧹'
  },
  [TICKET_CATEGORIES.SECURITY]: {
    label: 'Security',
    color: 'red',
    icon: '🔒'
  },
  [TICKET_CATEGORIES.HVAC]: {
    label: 'HVAC',
    color: 'lime',
    icon: '❄️'
  },
  [TICKET_CATEGORIES.FURNITURE]: {
    label: 'Furniture',
    color: 'gold',
    icon: '🪑'
  },
  [TICKET_CATEGORIES.LIGHTING]: {
    label: 'Lighting',
    color: 'yellow',
    icon: '💡'
  },
  [TICKET_CATEGORIES.OTHER]: {
    label: 'Other',
    color: 'default',
    icon: '📋'
  }
};

// Get category options for select dropdowns
export const getCategoryOptions = () => {
  return Object.entries(CATEGORY_CONFIG).map(([value, config]) => ({
    value,
    label: `${config.icon} ${config.label}`,
    color: config.color
  }));
};

// Get category display info
export const getCategoryDisplay = (category) => {
  return CATEGORY_CONFIG[category] || CATEGORY_CONFIG[TICKET_CATEGORIES.OTHER];
};
