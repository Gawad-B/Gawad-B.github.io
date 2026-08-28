/**
 * The Milano.
 *
 * The ship is an ORIGINAL procedurally-modelled craft built in homage
 * — no third-party model file, no reproduced design. The quips below
 * are original writing in a chaotic-space-adventure register; none of
 * them quote any film.
 */

export const MILANO = {
  name: 'The Milano',
  designation: 'UNREGISTERED · CLASS M-SALVAGE',
  /** Where it is illegally parked. */
  location: 'Cassini Division · Saturn ring system',

  /** The reason a visitor stops and squints. */
  citation: {
    title: 'PARKING VIOLATION',
    lines: [
      'ZONE: CASSINI DIVISION — NO STOPPING',
      'VESSEL: UNREGISTERED',
      'FINE: 40,000 UNITS',
      'DRIVER: ABSENT · PROBABLY INSIDE',
    ],
  },

  /** Proximity marker text, shown when the ship is on screen. */
  marker: 'UNREGISTERED VESSEL',

  /** Console boot log. Short, dry, professional-funny. */
  quips: [
    'You found the ship. Please do not touch anything.',
    'Communication systems: mostly operational.',
    'Yes, this is somehow a portfolio.',
    'Warning: developer detected.',
    'If this screen is blinking, pretend you did not see it.',
    'Navigation status: questionable but confident.',
    'Life support nominal. Coffee support critical.',
    'Reminder: the parking fine is still accruing.',
    'Cargo manifest: seven planets, forty-eight moons, one résumé.',
    'This console has been rebooted 1,204 times. All voluntary.',
    'Autopilot disengaged. It was getting opinionated.',
    'Transmission array warm. Say something interesting.',
  ],

  /** Shown above the contact form. */
  transmitPrompt: 'OPEN A CHANNEL',
  transmitHint: 'Message goes straight to the pilot. Response time: human.',
} as const;
