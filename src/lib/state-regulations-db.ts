/**
 * State Hunting Regulations Database
 * Manually curated, updated seasonally
 * SOURCE OF TRUTH - No guessing
 */

export interface StateRegulations {
  state: string
  stateName: string
  lastUpdated: string
  source: {
    name: string
    huntingGuideUrl: string
    licenseUrl: string
  }
  seasons: {
    [species: string]: {
      [seasonType: string]: string
    }
  }
  licenses: {
    [type: string]: string
  }
  bagLimits: {
    [species: string]: string
  }
  legalHours: string
  weapons: {
    [seasonType: string]: string
  }
}

/**
 * Maryland Hunting Regulations
 * Source: https://dnr.maryland.gov/huntersguide/Pages/default.aspx
 * Updated: 2024-25 Season
 */
const MARYLAND_REGULATIONS: StateRegulations = {
  state: 'MD',
  stateName: 'Maryland',
  lastUpdated: '2024-10-04',
  source: {
    name: 'Maryland Department of Natural Resources',
    huntingGuideUrl: 'https://dnr.maryland.gov/huntersguide/Pages/Seasons-and-Bag-Limits.aspx',
    licenseUrl: 'https://dnr.maryland.gov/buy-apply/Pages/Hunting/default.aspx'
  },
  seasons: {
    'White-tailed Deer': {
      'Archery': 'Sept 14, 2024 - Oct 31, 2024; Jan 1, 2025 - Jan 31, 2025',
      'Firearms (Varies by Region)': 'Nov 16, 2024 - Dec 7, 2024',
      'Muzzleloader': 'Oct 19, 2024 - Oct 27, 2024; Dec 14, 2024 - Dec 22, 2024'
    },
    'Sika Deer': {
      'Archery': 'Sept 7, 2024 - Nov 30, 2024',
      'Firearms': 'Oct 12, 2024 - Nov 30, 2024'
    },
    'Black Bear': {
      'Season': 'Oct 21, 2024 - Oct 26, 2024 (Western Maryland only)'
    },
    'Wild Turkey': {
      'Fall': 'Oct 19, 2024 - Nov 2, 2024 (select counties)',
      'Spring 2025': 'April 12, 2025 - May 20, 2025'
    },
    'Eastern Cottontail Rabbit': {
      'Season': 'Nov 2, 2024 - Feb 15, 2025'
    },
    'Gray Squirrel': {
      'Season': 'Sept 7, 2024 - Feb 28, 2025'
    },
    'Raccoon': {
      'Season': 'Oct 11, 2024 - Feb 15, 2025'
    },
    'Woodcock': {
      'Season': 'Nov 16, 2024 - Jan 31, 2025'
    },
    'Dove': {
      'Season': 'Sept 1, 2024 - Oct 5, 2024'
    }
  },
  licenses: {
    'Resident Hunting License': '$24.50',
    'Non-Resident Hunting License': '$120.50',
    'Junior Hunting License (16-17)': '$7.50',
    'Deer Stamp (required for deer hunting)': '$5.00',
    'Migratory Game Bird Stamp': '$5.00'
  },
  bagLimits: {
    'White-tailed Deer': 'Varies by region: 1-2 antlered deer per season, up to 10 antlerless deer (with bonus stamps)',
    'Black Bear': '1 per season',
    'Wild Turkey': '2 per season (spring)',
    'Eastern Cottontail Rabbit': 'No daily limit',
    'Gray Squirrel': 'No daily limit',
    'Raccoon': 'No daily limit',
    'Dove': '15 per day'
  },
  legalHours: '30 minutes before sunrise to 30 minutes after sunset (varies by species)',
  weapons: {
    'Archery': 'Longbows, recurve bows, compound bows (30+ lb draw)',
    'Firearms': 'Shotguns (20 gauge+), rifles (.243 caliber+), muzzleloaders',
    'Note': 'Specific weapon restrictions vary by region and season. Check DNR website for details.'
  }
}

/**
 * Pennsylvania Hunting Regulations
 * Source: https://www.pgc.pa.gov/
 * TODO: Update with 2024-25 season data
 */
const PENNSYLVANIA_REGULATIONS: StateRegulations = {
  state: 'PA',
  stateName: 'Pennsylvania',
  lastUpdated: '2024-10-04',
  source: {
    name: 'Pennsylvania Game Commission',
    huntingGuideUrl: 'https://www.pgc.pa.gov/HuntTrap/Law/Pages/Seasons-and-Bag-Limits.aspx',
    licenseUrl: 'https://www.pgc.pa.gov/HuntTrap/Licenses/Pages/default.aspx'
  },
  seasons: {
    'White-tailed Deer': {
      'Archery': 'Sept 16, 2024 - Nov 9, 2024; Dec 26, 2024 - Jan 18, 2025',
      'Firearms': 'Nov 30, 2024 - Dec 14, 2024',
      'Muzzleloader': 'Oct 19, 2024 - Oct 26, 2024'
    },
    'Black Bear': {
      'Archery': 'Sept 16, 2024 - Nov 9, 2024',
      'Firearms': 'Nov 23, 2024 - Nov 27, 2024'
    },
    'Wild Turkey': {
      'Fall': 'Oct 26, 2024 - Nov 23, 2024',
      'Spring 2025': 'Late April - Late May 2025'
    }
  },
  licenses: {
    'Resident Hunting License': '$20.97',
    'Non-Resident Hunting License': '$101.97',
    'Antlerless Deer License': '$6.97'
  },
  bagLimits: {
    'White-tailed Deer': '1 antlered per season, antlerless varies by license',
    'Black Bear': '1 per season',
    'Wild Turkey': '2 per season (fall)'
  },
  legalHours: '30 minutes before sunrise to 30 minutes after sunset',
  weapons: {
    'Archery': 'Bows with 35+ lb draw',
    'Firearms': 'Centerfire rifles, shotguns, muzzleloaders'
  }
}

// Database of all states
export const STATE_REGULATIONS_DB: Record<string, StateRegulations> = {
  'MD': MARYLAND_REGULATIONS,
  'PA': PENNSYLVANIA_REGULATIONS
  // Add more states as needed
}

/**
 * Get regulations for a state
 * Returns null if state not in database
 */
export function getStateRegulations(state: string): StateRegulations | null {
  const stateCode = state.toUpperCase()
  return STATE_REGULATIONS_DB[stateCode] || null
}
