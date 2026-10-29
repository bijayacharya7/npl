/**
 * Sourced NPL news summaries.
 *
 * These entries summarise reporting from the linked publishers. They are not
 * copied articles; readers should follow the source link for the full report.
 */

const ARTICLES = [
  {
    id: 'npl-2026-third-season-changes',
    slug: 'npl-2026-third-season-changes',
    title: 'What is new in the Nepal Premier League’s third season?',
    excerpt:
      'The 2026 NPL brings official T20 status, DRS, international names and upgrades at the TU International Cricket Ground.',
    category: 'Tournament',
    author: 'NPL Fan Zone News Desk',
    publishedAt: '2026-10-23T09:00:00+05:45',
    coverImageUrl:
      'https://assets-cdn.kathmandupost.com/uploads/source/news/2026/third-party/tugroundnepalphotolibrary8221020260544321000x0-1792720342.jpg',
    imageCredit: 'Nepal Photo Library / The Kathmandu Post',
    relatedTeamId: null,
    relatedPlayerId: null,
    isSample: false,
    status: 'published',
    seoTitle: 'What is new in the Nepal Premier League 2026?',
    seoDescription:
      'A sourced summary of the changes introduced for the third season of the Nepal Premier League.',
    content: [
      {
        type: 'paragraph',
        text:
          'The third season of the Nepal Premier League starts on 26 October at the TU International Cricket Ground in Kirtipur. The tournament is entering a new phase with official T20 recognition and several changes to match operations.',
      },
      { type: 'heading', text: 'Technology and official status' },
      {
        type: 'paragraph',
        text:
          'The season will use the Decision Review System, while the ICC sanction means performances in this edition count towards official Twenty20 records. The review system is expected to add time to matches, so the schedule includes additional room.',
      },
      { type: 'heading', text: 'More than cricket' },
      {
        type: 'paragraph',
        text:
          'The report also highlights overseas signings and improvements to the Kirtipur ground, including added seating, a new scoreboard and upgraded player, media and spectator facilities.',
      },
    ],
    source: {
      label: 'The Kathmandu Post',
      url: 'https://kathmandupost.com/cricket/2026/10/23/what-s-new-in-the-nepal-premier-league-s-third-season',
    },
    lastVerified: '2026-10-29',
  },
  {
    id: 'npl-2026-schedule-revised',
    slug: 'npl-2026-schedule-revised',
    title: 'NPL 2026 schedule revised ahead of the third season',
    excerpt:
      'The revised Nepal Premier League schedule sets the match window, evening starts and the playoff route at Kirtipur.',
    category: 'Tournament',
    author: 'NPL Fan Zone News Desk',
    publishedAt: '2026-10-20T12:30:00+05:45',
    coverImageUrl:
      'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80',
    imageCredit: 'Unsplash',
    relatedTeamId: null,
    relatedPlayerId: null,
    isSample: false,
    status: 'published',
    seoTitle: 'NPL 2026 revised schedule and playoff dates',
    seoDescription:
      'The revised NPL 2026 schedule, venues and playoff dates, sourced from the published schedule report.',
    content: [
      {
        type: 'paragraph',
        text:
          'The Nepal Premier League’s 2026 season runs from 26 October to 21 November, with the tournament staged at the TU International Cricket Ground in Kirtipur.',
      },
      {
        type: 'paragraph',
        text:
          'The published schedule contains 28 league matches followed by Qualifier 1, the Eliminator, Qualifier 2 and the final. Double-header days use afternoon and evening starts, while single-match days begin in the evening.',
      },
      {
        type: 'paragraph',
        text:
          'Check the fixtures page for the structured match list and local Nepal time conversions. Schedule details can change after official announcements.',
      },
    ],
    source: {
      label: 'Radio Nepal',
      url: 'https://radionepalonline.com/en/2026/10/20/438063.html',
    },
    lastVerified: '2026-10-29',
  },
  {
    id: 'npl-2026-opening-match-preview',
    slug: 'npl-2026-opening-match-preview',
    title: 'Lumbini Lions and Sudurpaschim Royals open NPL 2026',
    excerpt:
      'The defending champions meet the 2025 runners-up in the opening fixture of Nepal Premier League Season 3.',
    category: 'Match Preview',
    author: 'NPL Fan Zone News Desk',
    publishedAt: '2026-10-25T09:00:00+05:45',
    coverImageUrl:
      'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80',
    imageCredit: 'Unsplash',
    relatedTeamId: 'lumbini-lions',
    relatedPlayerId: null,
    isSample: false,
    status: 'published',
    seoTitle: 'Lumbini Lions vs Sudurpaschim Royals NPL 2026 opener',
    seoDescription:
      'A sourced NPL 2026 opening-match preview covering the fixture, venue and tournament context.',
    content: [
      {
        type: 'paragraph',
        text:
          'Lumbini Lions begin their title defence against Sudurpaschim Royals in the first match of the 2026 Nepal Premier League at Kirtipur on 26 October.',
      },
      {
        type: 'paragraph',
        text:
          'The fixture brings together last season’s champions and runners-up before the remaining six franchises enter the league schedule. Both teams will be looking to start the 28-match league stage with an early win.',
      },
      {
        type: 'paragraph',
        text:
          'This preview uses the published fixture and previous-season context. Confirmed scores and match events are added separately through the verified match-data feed.',
      },
    ],
    source: {
      label: 'Radio Nepal schedule report',
      url: 'https://radionepalonline.com/en/2026/10/20/438063.html',
    },
    lastVerified: '2026-10-29',
  },
]

export const ARTICLE_CATEGORIES = ['Explainer', 'Tournament', 'Team News', 'Transfer News', 'Match Preview']
export { ARTICLES }
export const ARTICLE_BY_SLUG = Object.fromEntries(ARTICLES.map((article) => [article.slug, article]))
