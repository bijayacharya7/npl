/** NPL career and tournament records as of 23 October 2026.
 * Season 3 is still upcoming, so these figures cover completed seasons 2024–25.
 */
export const RECORDS_AS_OF = '23 October 2026 (through the 2025 season)'

export const RECORD_SOURCES = [
  {
    label: 'StatsNPL — NPL all-time records',
    url: 'https://statsnpl.com/',
  },
  {
    label: 'OpenCricket — ball-by-ball archive and career leaderboards',
    url: 'https://opencricketapi.com/coverage/nepal-premier-league',
  },
  {
    label: 'CricketViz — 2025 season batting and bowling tables',
    url: 'https://cricketviz.in/npl/2025',
  },
  {
    label: 'Cricket Chautari — completed-season NPL records',
    url: 'https://cricketchautari.com/nepal-premier-league',
  },
  {
    label: 'CAN schedule revision and DRS (Radio Nepal)',
    url: 'https://radionepalonline.com/en/2026/10/20/438063.html',
  },
  {
    label: 'Season 3 official T20 status (The Kathmandu Post)',
    url: 'https://kathmandupost.com/cricket/2026/10/23/what-s-new-in-the-nepal-premier-league-s-third-season',
  },
]

export const ALL_TIME_RUNS = [
  { name: 'Rohit Paudel', team: 'Lumbini Lions', runs: 555, matches: 17, average: '32.65', strikeRate: '113.50' },
  { name: 'Ravi Bopara', team: 'Chitwan Rhinos', runs: 523, matches: 15, average: '37.36', strikeRate: '133.08' },
  { name: 'Binod Bhandari', team: 'Sudurpaschim Royals', runs: 499, matches: 18, average: '31.19', strikeRate: '110.40' },
  { name: 'Saif Zaib', team: 'Sudurpaschim Royals', runs: 391, matches: 16, average: '24.44', strikeRate: '135.29' },
  { name: 'Dipendra Singh Airee', team: 'Sudurpaschim Royals', runs: 389, matches: 17, average: '32.42', strikeRate: '147.35' },
  { name: 'Basir Ahamad', team: 'Biratnagar Kings', runs: 372, matches: 16, average: '28.62', strikeRate: '120.39' },
  { name: 'Kushal Malla', team: 'Chitwan Rhinos', runs: 358, matches: 15, average: '27.54', strikeRate: '121.36' },
  { name: 'James Neesham', team: 'Janakpur Bolts', runs: 346, matches: 13, average: '34.60', strikeRate: '185.03' },
  { name: 'Lahiru Milantha', team: 'Janakpur Bolts', runs: 323, matches: 12, average: '29.36', strikeRate: '125.19' },
  { name: 'Adam Rossington', team: 'Pokhara Avengers', runs: 323, matches: 7, average: '53.83', strikeRate: '150.93' },
]

export const ALL_TIME_WICKETS = [
  { name: 'Scott Kuggeleijn', team: 'Sudurpaschim Royals', wickets: 27 },
  { name: 'Karan KC', team: 'Kathmandu Gorkhas', wickets: 25 },
  { name: 'Abinash Bohara', team: 'Sudurpaschim Royals', wickets: 24 },
  { name: 'Sher Malla', team: 'Lumbini Lions', wickets: 24 },
  { name: 'Sandeep Lamichhane', team: 'Biratnagar Kings', wickets: 23 },
  { name: 'Sohail Tanvir', team: 'Chitwan Rhinos', wickets: 22 },
  { name: 'Lalit Rajbanshi', team: 'Janakpur Bolts', wickets: 21 },
  { name: 'Harmeet Singh', team: 'Janakpur Bolts', wickets: 20 },
  { name: 'Shahab Alam', team: 'Kathmandu Gorkhas', wickets: 19 },
  { name: 'Nandan Yadav', team: 'Karnali Yaks', wickets: 19 },
]

export const TOURNAMENT_RECORDS = [
  { label: 'Most career runs', value: '555', detail: 'Rohit Paudel', teamId: 'lumbini-lions' },
  { label: 'Most career wickets', value: '27', detail: 'Scott Kuggeleijn', teamId: 'sudurpaschim-royals' },
  { label: 'Highest individual score', value: '114* (44)', detail: 'Mark Watt, 2025', teamId: 'karnali-yaks' },
  { label: 'Best bowling figures', value: '6/25', detail: 'Shahab Alam, 2025', teamId: 'kathmandu-gurkhas' },
  { label: 'Most sixes', value: '31', detail: 'James Neesham', teamId: 'janakpur-bolts' },
  { label: 'Best strike rate', value: '185.03', detail: 'James Neesham (100+ balls)', teamId: 'janakpur-bolts' },
  { label: 'Best batting average', value: '53.83', detail: 'Adam Rossington (3+ innings)', teamId: 'pokhara-avengers' },
  { label: 'Highest team total', value: '220/6', detail: 'v Pokhara Avengers, 2025', teamId: 'biratnagar-kings' },
  { label: 'Lowest team total', value: '51', detail: 'v Sudurpaschim Royals, 2024', teamId: 'janakpur-bolts' },
]

export const CHAMPIONS = [
  { season: '2024 · Season 1', champion: 'Janakpur Bolts', championId: 'janakpur-bolts', runnerUp: 'Sudurpaschim Royals', runnerUpId: 'sudurpaschim-royals', result: 'Won by 5 wickets' },
  { season: '2025 · Season 2', champion: 'Lumbini Lions', championId: 'lumbini-lions', runnerUp: 'Sudurpaschim Royals', runnerUpId: 'sudurpaschim-royals', result: 'Won by 6 wickets' },
]
