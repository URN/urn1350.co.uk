// Competition terms. Wording is the station's existing terms; to add a competition-specific
// set of rules, add an entry to SPECIFIC.

export const CONTACT = 'finance@urn1350.co.uk';

export const GENERAL = {
  title: 'Rules for every competition',
  intro:
    'All competitions run by University Radio Nottingham (URN) are governed by the following rules. Competitions on URN will be advertised either on air, on our website (urn1350.co.uk) or on our social media pages detailing how to enter the competition, quantities and specifics of prizes and any other restrictions/conditions of entry.',
  rules: [
    'Competitions are open to UK residents, aged eighteen or over only, unless explicitly stated otherwise.',
    'Only one entry is allowed per person. Multiple entries will be immediately discounted.',
    'Entries must be received with all required information, within the given time period, any incomplete or late entries will not be accepted.',
    "Competition entries must include the entrant's name and telephone number (or email address where applicable). These details will only be used for the administration of competitions, and will then be destroyed.",
    'Entries to competitions become the immediate property of URN, to use freely as we see fit without prior consent of the entrant.',
    'On the closing of the competition, all valid entries will be selected and a winner drawn at random. The draw will be made by the On Air Presenter, Producer or other designated member of URN. Prizes with a value of £50 or greater will be drawn by a member of the URN Committee.',
    'There is no cash alternative for any prizes, unless explicitly stated, and prizes are non-transferable.',
    'Winners will be contacted personally via telephone or e-mail after the competition. If a winner cannot be contacted within an hour (unless otherwise stated) of the competition being drawn, URN reserves the right to draw a new winner at random.',
    "Prizes must be collected within five Students' Union days, unless otherwise stated. URN reserves the right to give away unclaimed prizes after this period.",
    'URN reserves the right to change, add to or remove from these rules at any point. Competitions may have additional or amended Terms and Conditions, which will be outlined on urn1350.co.uk/competition-terms.',
  ],
};

export const SPECIFIC = [
  {
    id: 'ocean',
    title: 'The Official Pre-Ocean Show: 4 Ocean Tickets',
    intro: 'Prizes must be used on the night that the competition is run.',
    rules: [
      'URN will attempt to contact the winner as soon as they are drawn, if they cannot be contacted by 9pm, then a new winner will be drawn.',
      'Entry to Ocean is only valid before 11pm.',
      'The winner and three guests must enter Ocean together as a group and not separately.',
      'Entrants are only allowed to win this competition once per academic term. A record of all winners is kept, and previous winners in that term are ineligible for entry and their entries will be discounted.',
    ],
  },
  {
    id: 'twelve-days',
    title: '12 Days of URN',
    intro: '',
    rules: [
      'All entries must be received before the deadline of 9pm each day.',
      "All winners will be drawn by URN's Station Manager via a random name generator.",
      'All winners are subject to review by management. Management reserves the right to re-draw a winner, based on a number of factors, including but not limited to, being a member of the URN Committee or not attending the University of Nottingham.',
      'All entrants understand that some prizes will take longer than others to arrive, and URN is under no obligation to distribute prizes immediately, although URN will make every attempt to distribute prizes as soon as possible.',
      'All prizes are provided by external sponsors, and URN has no control or liability if they decide to amend or refuse a prize after the competition has ended.',
      'If someone is tagged more than once by the same person, this will only be counted as one entry.',
    ],
  },
];
