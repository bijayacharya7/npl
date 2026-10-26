/**
 * Sample editorial content for development.
 *
 * These are ORIGINAL explainer pieces written for NPL Fan Zone, not news
 * reports. They contain no quotes and no invented match results. Everything
 * here is marked `isSample: true` so the UI can label it and so real published
 * articles can be distinguished in the admin dashboard.
 */

const SOURCE = {
  label: 'NPL Fan Zone editorial (sample content)',
  url: null,
}

export const ARTICLES = [
  {
    id: 'how-the-npl-2026-league-stage-works',
    slug: 'how-the-npl-2026-league-stage-works',
    title: 'How the NPL 2026 league stage works',
    excerpt:
      'Eight teams, 28 league matches and four playoff games. Here is the simple version of how the 2026 Nepal Premier League decides its champion.',
    category: 'Explainer',
    author: 'NPL Fan Zone Editorial',
    publishedAt: '2026-10-20T09:00:00+05:45',
    coverImageUrl: null,
    relatedTeamId: null,
    relatedPlayerId: null,
    isSample: true,
    status: 'published',
    seoTitle: 'NPL 2026 format explained: league stage, playoffs and final',
    seoDescription:
      'A plain-language guide to the NPL 2026 format: a single round-robin league, Qualifier 1, the Eliminator, Qualifier 2 and the final in Kirtipur.',
    content: [
      {
        type: 'paragraph',
        text:
          'The 2026 Nepal Premier League is the third season of the franchise T20 competition organised by the Cricket Association of Nepal. Eight teams play each other once in a single round-robin league, which adds up to 28 matches between 26 October and 15 November.',
      },
      {
        type: 'paragraph',
        text:
          'Every league match is played at the Tribhuvan University International Cricket Ground in Kirtipur. Double-header days start at 12:30 pm Nepal time, with the second match at 5:00 pm. Single-match days start at 5:00 pm.',
      },
      { type: 'heading', text: 'The playoffs' },
      {
        type: 'paragraph',
        text:
          'The top four teams after the league stage move into a four-match playoff bracket. First plays second in Qualifier 1 on 17 November. The winner goes straight to the final. Third plays fourth in the Eliminator on 18 November, and the loser is out.',
      },
      {
        type: 'paragraph',
        text:
          'The loser of Qualifier 1 then meets the winner of the Eliminator in Qualifier 2 on 19 November. That winner completes the final line-up for 21 November. It is the same structure used by several T20 leagues: finishing in the top two gives a team a second chance.',
      },
      { type: 'heading', text: 'What happens if it rains?' },
      {
        type: 'paragraph',
        text:
          'Nepal in late October can be dry, but the competition regulations decide how abandoned matches are scored. Our points table is calculated from entered results and can be configured in the admin dashboard. Where the official playing conditions differ, the official regulations take priority.',
      },
      {
        type: 'paragraph',
        text:
          'This article is sample editorial content for the development build of NPL Fan Zone. It is not an official NPL publication.',
      },
    ],
    source: SOURCE,
    lastVerified: '2026-10-22',
  },
  {
    id: 'fan-guide-eight-teams',
    slug: 'fan-guide-eight-teams',
    title: 'A fan\u2019s guide to the eight NPL 2026 teams',
    excerpt:
      'From the defending champions in Lumbini to Kathmandu Gorkhas, here is a quick orientation to every franchise in Season 3.',
    category: 'Fan Guide',
    author: 'NPL Fan Zone Editorial',
    publishedAt: '2026-10-18T12:00:00+05:45',
    coverImageUrl: null,
    relatedTeamId: null,
    relatedPlayerId: null,
    isSample: true,
    status: 'published',
    seoTitle: 'NPL 2026 teams: a fan guide to all eight franchises',
    seoDescription:
      'Meet the eight Nepal Premier League 2026 franchises, their home cities, captains and head coaches in this independent fan guide.',
    content: [
      {
        type: 'paragraph',
        text:
          'The Nepal Premier League spreads eight franchises across the country, from Biratnagar in the east to Dhangadhi in the far west. Each squad mixes Nepal internationals with overseas signings, and each has its own personality.',
      },
      { type: 'heading', text: 'Defending champions' },
      {
        type: 'paragraph',
        text:
          'Lumbini Lions won the 2025 title and return under Rohit Paudel. The Lions face Sudurpaschim Royals, the 2025 runners-up, in the opening match of Season 3 on 26 October.',
      },
      { type: 'heading', text: 'The capital and the lake city' },
      {
        type: 'paragraph',
        text:
          'Kathmandu Gorkhas, captained by Karan KC, play out of the country\u2019s biggest cricket market. Pokhara Avengers, led by Kushal Bhurtel, represent Gandaki province. Both squads include well-known overseas players for 2026.',
      },
      { type: 'heading', text: 'Eastern and central Nepal' },
      {
        type: 'paragraph',
        text:
          'Biratnagar Kings are captained by Sandeep Lamichhane, while Chitwan Rhinos are led by Kushal Malla. Janakpur Bolts and Karnali Yaks complete the eight, giving Madhesh and Karnali their own franchises.',
      },
      {
        type: 'paragraph',
        text:
          'Squad lists, captains and coaches in this guide come from published 2026 squad trackers. Individual player roles that could not be verified are left blank rather than guessed. This is sample editorial content, not official NPL material.',
      },
    ],
    source: SOURCE,
    lastVerified: '2026-10-22',
  },
  {
    id: 'net-run-rate-explained',
    slug: 'net-run-rate-explained',
    title: 'Net run rate explained for NPL fans',
    excerpt:
      'Two teams level on points? Net run rate decides who goes through. Here is how it is calculated, including the all-out rule that confuses everyone.',
    category: 'Explainer',
    author: 'NPL Fan Zone Editorial',
    publishedAt: '2026-10-16T08:30:00+05:45',
    coverImageUrl: null,
    relatedTeamId: null,
    relatedPlayerId: null,
    isSample: true,
    status: 'published',
    seoTitle: 'Net run rate explained: how NPL 2026 standings are decided',
    seoDescription:
      'Learn how cricket net run rate works, why an all-out team is treated as having faced the full overs quota, and how NPL tie-breaks work.',
    content: [
      {
        type: 'paragraph',
        text:
          'Net run rate (NRR) compares the rate at which a team scores runs with the rate at which it concedes them. It is the first tie-break in most T20 leagues and can decide a playoff place.',
      },
      { type: 'heading', text: 'The basic formula' },
      {
        type: 'paragraph',
        text:
          'Net run rate equals runs scored per over, minus runs conceded per over. Only completed matches count. A team that wins by chasing a target still has its full chase recorded, so the calculation uses the runs actually scored and the overs actually faced.',
      },
      { type: 'heading', text: 'The all-out rule' },
      {
        type: 'paragraph',
        text:
          'If a team is bowled out before its overs are finished, it is treated as having faced the full quota - 20 overs in the NPL - when calculating run rate. That stops a team from improving its run rate by being dismissed quickly. Our calculation follows this convention, and the rule is configurable.',
      },
      { type: 'heading', text: 'Why numbers can look strange' },
      {
        type: 'paragraph',
        text:
          'Abandoned matches and no-results do not count toward NRR, even though both teams may receive a point. If an innings is reduced by weather, the revised overs are used. That is one reason our table shows the data it used for every match.',
      },
      {
        type: 'paragraph',
        text:
          'This is general explainer content, not a copy of the official NPL 2026 playing conditions. Always check the official regulations for the binding version.',
      },
    ],
    source: SOURCE,
    lastVerified: '2026-10-22',
  },
  {
    id: 'what-is-new-in-npl-2026',
    slug: 'what-is-new-in-npl-2026',
    title: 'What is new in NPL 2026, and what we still need to verify',
    excerpt:
      'A transparent look at the Season 3 build-up: dates, venue, broadcast details and the information NPL Fan Zone is still checking.',
    category: 'Tournament',
    author: 'NPL Fan Zone Editorial',
    publishedAt: '2026-10-14T18:00:00+05:45',
    coverImageUrl: null,
    relatedTeamId: null,
    relatedPlayerId: null,
    isSample: true,
    status: 'published',
    seoTitle: 'NPL 2026: Season 3 dates, venue and verification notes',
    seoDescription:
      'What we know about NPL 2026, what is confirmed, and how this independent fan site labels information that is still awaiting verification.',
    content: [
      {
        type: 'paragraph',
        text:
          'Season 3 of the Nepal Premier League runs from 26 October to 21 November 2026, with all 32 matches at the TU International Cricket Ground in Kirtipur. The schedule and the eight-team format were published before the tournament.',
      },
      { type: 'heading', text: 'How this site handles data' },
      {
        type: 'paragraph',
        text:
          'NPL Fan Zone is an independent fan project. We store tournament data in structured seed files and, once Supabase is connected, in a proper database. Schedules and squads carry a source and a last-verified date.',
      },
      {
        type: 'paragraph',
        text:
          'Where information is uncertain - for example a player role that two squad trackers describe differently - we show an unverified label rather than filling the gap. Match results and live scores are never fabricated; until an authorised feed or manual scorecard is entered, matches stay marked as upcoming.',
      },
      { type: 'heading', text: 'What is not here yet' },
      {
        type: 'paragraph',
        text:
          'There is no official live-score feed connected to this build. If you need real-time scores, connect an authorised cricket data provider and enter its server-side key. Until then, admins can update scorecards manually.',
      },
      {
        type: 'paragraph',
        text:
          'This article is sample content for the development build and should be replaced or removed before launch.',
      },
    ],
    source: SOURCE,
    lastVerified: '2026-10-22',
  },
]

export const ARTICLE_CATEGORIES = ['Explainer', 'Tournament', 'Team News', 'Transfer News', 'Match Preview']

export const ARTICLE_BY_SLUG = Object.fromEntries(ARTICLES.map((a) => [a.slug, a]))
