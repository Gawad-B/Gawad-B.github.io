/**
 * The Milano.
 *
 * The ship is an ORIGINAL procedurally-modelled craft built in homage
 * — no third-party model file, no reproduced design. The quips below
 * are original writing in a chaotic-space-adventure register; none of
 * them quote any film.
 */

/** The harbor at the far point of the survey. Aphelion is the outermost
    point of an orbit — which is exactly what a waystation at the system's
    edge is. It also gives the parking citation an author at last. */
export const STATION = {
  name: 'Aphelion Station',
  panel: 'STN APHELION',
  designation: 'DEEP-RANGE RELAY · SYSTEM EDGE',
  berth: 'BERTH 7',
} as const;

export const MILANO = {
  name: 'The Milano',
  designation: 'UNREGISTERED · CLASS M-SALVAGE',
  /** Where it is docked — technically legally, extremely overdue. */
  location: `${STATION.berth} · ${STATION.panel} — system edge`,

  /** The reason a visitor stops and squints. The joke migrated with the
      ship: no longer an illegal SPOT, now an illegal DURATION. */
  citation: {
    title: 'PARKING VIOLATION',
    lines: [
      'ZONE: BERTH 7 — VISITORS · 15 MIN MAX',
      'TIME DOCKED: 11 YEARS · ONGOING',
      'FEES ACCRUED: 40,000 UNITS AND COUNTING',
      'DRIVER: ABSENT · PROBABLY INSIDE',
    ],
  },

  /** Proximity marker text, shown when the ship is on screen. */
  marker: 'UNREGISTERED VESSEL · BERTH 7',

  /** Console boot log. Short, dry, professional-funny. */
  quips: [
    'You found the ship. Please do not touch anything.',
    'Communication systems: mostly operational.',
    'Yes, this is somehow a portfolio.',
    'Warning: developer detected.',
    'If this screen is blinking, pretend you did not see it.',
    'Navigation status: questionable but confident.',
    'Life support nominal. Coffee support critical.',
    'Reminder: the berth fees are still accruing.',
    'Harbor Control has stopped sending warnings. We miss them.',
    'Cargo manifest: seven planets, forty-eight moons, one résumé.',
    'This console has been rebooted 1,204 times. All voluntary.',
    'Autopilot disengaged. It was getting opinionated.',
    'Transmission array warm. Say something interesting.',
  ],

  /** Shown above the contact form. */
  transmitPrompt: 'OPEN A CHANNEL',
  transmitHint: 'Message goes straight to the pilot. Response time: human.',
} as const;
