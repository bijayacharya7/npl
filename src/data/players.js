/**
 * NPL 2026 squads.
 *
 * Sources (retrieved 2026-10-22):
 *  - https://en.wikipedia.org/wiki/2026_Nepal_Premier_League (auction/retention list)
 *  - https://english.khabarhub.com/2026/07/557344/ (auction report)
 *  - https://statsnpl.com/articles/npl-season-3-auction-sold-players-list/ (roles)
 *  - https://chitwanrhinos.com/team and https://lumbinilions.com.np/our-squad
 *
 * A `verified: false` entry means the player appears in a published squad list
 * but could not be cross-checked against a second source. Those rows are shown
 * with an "Unverified" badge in the app. Roles left as `null` were not stated by
 * any source we checked - they are never guessed.
 */

import { TEAMS } from './teams.js'

const SOURCE = {
  label: 'Published NPL 2026 squad lists (Wikipedia, Khabarhub, franchise sites)',
  url: 'https://en.wikipedia.org/wiki/2026_Nepal_Premier_League',
}

/** [name, role, nationality, flags] where flags: c = captain, wk = keeper, u = unverified */
const ROSTERS = {
  'biratnagar-kings': [
    ['Sandeep Lamichhane', 'bowler', 'Nepal', 'c'],
    ['Andre Russell', 'all-rounder', 'West Indies'],
    ['Charith Asalanka', 'all-rounder', 'Sri Lanka'],
    ['Shubham Ranjane', 'all-rounder', 'United States'],
    ['Lokesh Bam', 'wicketkeeper', 'Nepal'],
    ['Dilsad Ali', 'wicketkeeper', 'Nepal'],
    ['Imran Sheikh', 'batter', 'Nepal'],
    ['Basir Ahamad', 'all-rounder', 'Nepal'],
    ['Aprajit Poudel', 'bowler', 'Nepal'],
    ['Narayan Joshi', null, 'Nepal'],
    ['Naren Saud', 'bowler', 'Nepal'],
    ['Pratik Shrestha', 'all-rounder', 'Nepal'],
    ['Pratish GC', null, 'Nepal'],
    ['Rupesh Singh', 'all-rounder', 'Nepal'],
    ['Subash Bhandari', null, 'Nepal'],
    ['Sujan Thapaliya', 'all-rounder', 'Nepal'],
    ['Prajwal Thapa', 'wicketkeeper', 'Nepal', 'u'],
    ['Jishan Alam', null, null, 'u'],
  ],
  'chitwan-rhinos': [
    ['Kushal Malla', 'all-rounder', 'Nepal', 'c'],
    ['Ranjeet Kumar', 'bowler', 'Nepal'],
    ['Deepak Bohara', 'wicketkeeper', 'Nepal'],
    ['Dev Khanal', 'batter', 'Nepal'],
    ['Bipin Rawal', 'wicketkeeper', 'Nepal'],
    ['Rijan Dhakal', 'bowler', 'Nepal'],
    ['Arjun Saud', 'wicketkeeper', 'Nepal'],
    ['Kamal Singh Airee', 'bowler', 'Nepal'],
    ['Gautam KC', 'bowler', 'Nepal'],
    ['Mousam Dhakal', 'bowler', 'Nepal'],
    ['Ravi Bopara', 'all-rounder', 'England'],
    ['Bibek Yadav', 'all-rounder', 'Nepal'],
    ['Ashok Dhami', 'bowler', 'Nepal'],
    ['Salahuddin Khan', 'all-rounder', 'Nepal'],
    ['Sikandar Raza', 'all-rounder', 'Zimbabwe'],
    ['Kaleem Sana', 'bowler', 'Canada'],
    ['Usama Mir', 'bowler', 'Pakistan', 'u'],
  ],
  'janakpur-bolts': [
    ['Harmeet Singh', 'all-rounder', 'United States', 'c'],
    ['Aaditya Mahata', null, 'Nepal'],
    ['Aashutosh Pandey', null, 'Nepal'],
    ['Abhishek Tiwari', 'all-rounder', 'Nepal'],
    ['Amar Rautela', 'all-rounder', 'Nepal'],
    ['Anil Sah', 'wicketkeeper', 'Nepal'],
    ['Bikash Aagri', null, 'Nepal'],
    ['Bishal Patel', 'all-rounder', 'Nepal'],
    ['Bishal Susling', 'all-rounder', 'Nepal'],
    ['Iftikhar Ahmed', 'all-rounder', 'Pakistan'],
    ['James Neesham', 'all-rounder', 'New Zealand'],
    ['Lalit Rajbanshi', 'bowler', 'Nepal'],
    ['Mayan Yadav', null, 'Nepal'],
    ['Moeen Ali', 'all-rounder', 'England'],
    ['Rit Gautam', 'batter', 'Nepal'],
    ['Santosh Karki', 'wicketkeeper', 'Nepal'],
    ['Trit Raj Das', 'batter', 'Nepal'],
  ],
  'karnali-yaks': [
    ['Sompal Kami', 'all-rounder', 'Nepal', 'c'],
    ['Ariful Islam', 'batter', 'Bangladesh'],
    ['Bipin Sharma', 'bowler', 'Nepal'],
    ['Deepak Dumre', null, 'Nepal'],
    ['Dipendra Rawat', 'all-rounder', 'Nepal'],
    ['Diwan Pun', 'all-rounder', 'Nepal'],
    ['Gulshan Jha', null, 'Nepal'],
    ['Mark Watt', 'all-rounder', 'Scotland'],
    ['Akbar Ali', 'wicketkeeper', 'Bangladesh'],
    ['Nandan Yadav', null, 'Nepal'],
    ['Pawan Sarraf', null, 'Nepal'],
    ['Sachin Sharma', 'batter', 'Nepal'],
    ['Shubh Kansakar', 'batter', 'Nepal'],
    ['Surya Tamang', 'bowler', 'Nepal'],
    ['Unish Thakuri', null, 'Nepal'],
    ['Yuvraj Khatri', null, 'Nepal'],
    ['Hussain Talat', 'all-rounder', 'Pakistan'],
  ],
  'kathmandu-gurkhas': [
    ['Karan KC', 'all-rounder', 'Nepal', 'c'],
    ['Mohammad Aadil Alam', null, 'Nepal'],
    ['Shahab Alam', null, 'Nepal'],
    ['Sahan Arachchige', 'all-rounder', 'Sri Lanka'],
    ['K. S. Bharat', 'wicketkeeper', 'India'],
    ['Will Bosisto', 'batter', 'Australia'],
    ['Sonu Devkota', 'bowler', 'Nepal'],
    ['Prashiddha Jaisi', 'all-rounder', 'Nepal'],
    ['Rashid Khan', 'bowler', 'Nepal'],
    ['Suryanshu Koirala', 'batter', 'Nepal'],
    ['Dayanand Mandal', 'bowler', 'Nepal'],
    ['Sahil Patel', 'wicketkeeper', 'Nepal'],
    ['Krishna Paudel', null, 'Nepal'],
    ['Dev Shah', null, 'Nepal'],
    ['Bhim Sharki', null, 'Nepal'],
    ['David Warner', 'batter', 'Australia'],
    ['Santosh Yadav', null, 'Nepal'],
  ],
  'lumbini-lions': [
    ['Rohit Paudel', 'all-rounder', 'Nepal', 'c'],
    ['Dinesh Adhikari', 'bowler', 'Nepal'],
    ['Tilak Bhandari', 'bowler', 'Nepal'],
    ['Ajay Chauhan', 'bowler', 'Nepal'],
    ['Niroshan Dickwella', 'wicketkeeper', 'Sri Lanka'],
    ['Abhishesh Gautam', 'bowler', 'Nepal'],
    ['Durgesh Gupta', 'all-rounder', 'Nepal'],
    ['Sundeep Jora', 'batter', 'Nepal'],
    ['Kishore Mahato', 'bowler', 'Nepal'],
    ['Sher Malla', 'all-rounder', 'Nepal'],
    ['Dilip Nath', 'wicketkeeper', 'Nepal'],
    ['Aasif Sheikh', 'wicketkeeper', 'Nepal'],
    ["D'Arcy Short", 'all-rounder', 'Australia'],
    ['Aakash Tripathi', 'batter', 'Nepal'],
    ['Ruben Trumpelmann', 'bowler', 'Namibia'],
    ['Arniko Yadav', 'bowler', 'Nepal'],
  ],
  'pokhara-avengers': [
    ['Kushal Bhurtel', 'batter', 'Nepal', 'c'],
    ['Bipin Acharya', 'all-rounder', 'Nepal'],
    ['Sudip Aryal', 'bowler', 'Nepal'],
    ['Sunny BK', 'all-rounder', 'Nepal'],
    ['Aakash Chand', 'bowler', 'Nepal'],
    ['Sagar Dhakal', 'bowler', 'Nepal'],
    ['Arjun Gharti', 'wicketkeeper', 'Nepal'],
    ['Shakib Al Hasan', 'all-rounder', 'Bangladesh'],
    ['Chamika Karunaratne', 'all-rounder', 'Sri Lanka'],
    ['Dinesh Kharel', 'batter', 'Nepal'],
    ['Arjun Kumal', 'all-rounder', 'Nepal'],
    ['Bipin Khatri', 'bowler', 'Nepal'],
    ['Dhananjaya Lakshan', 'all-rounder', 'Sri Lanka'],
    ['Bibek Magar', 'batter', 'Nepal'],
    ['Pratik Pokharel', 'bowler', 'Nepal'],
    ['Kiran Thagunna', 'batter', 'Nepal'],
    ['Mahedi Hasan', 'all-rounder', 'Bangladesh'],
    ['Mohammad Saifuddin', null, 'Bangladesh', 'u'],
  ],
  'sudurpaschim-royals': [
    ['Dipendra Singh Airee', 'all-rounder', 'Nepal', 'c'],
    ['Haider Ali', 'batter', 'Pakistan'],
    ['Binod Bhandari', 'wicketkeeper', 'Nepal'],
    ['Abinash Bohara', 'bowler', 'Nepal'],
    ['Dipak Bohara', 'wicketkeeper', 'Nepal'],
    ['Milan Bohara', 'all-rounder', 'Nepal'],
    ['Sachin Bhatta', 'bowler', 'Nepal'],
    ['Ayub Chand', null, 'Nepal', 'u'],
    ['Hemant Dhami', null, 'Nepal'],
    ['Anil Kharel', 'bowler', 'Nepal'],
    ['Scott Kuggeleijn', 'all-rounder', 'New Zealand'],
    ['Hikmat Mahara', null, 'Nepal'],
    ['Brandon McMullen', 'all-rounder', 'Scotland'],
    ['Ishan Pandey', null, 'Nepal'],
    ['Tek Rawat', 'wicketkeeper', 'Nepal'],
    ['Aarif Sheikh', null, 'Nepal'],
    ['Saif Zaib', 'all-rounder', 'England'],
  ],
}

export const ROLE_LABELS = {
  batter: 'Batter',
  bowler: 'Bowler',
  'all-rounder': 'All-rounder',
  wicketkeeper: 'Wicketkeeper',
}

export function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['.]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export const PLAYERS = Object.entries(ROSTERS).flatMap(([teamId, roster]) =>
  roster.map(([name, role, nationality, flags = '']) => ({
    id: slugify(name),
    name,
    teamId,
    role: role ?? null,
    nationality: nationality ?? null,
    isOverseas: Boolean(nationality && nationality !== 'Nepal'),
    isCaptain: flags.includes('c'),
    jerseyNumber: null,
    imageUrl: null,
    bio: null,
    verified: !flags.includes('u'),
    source: SOURCE,
    lastVerified: '2026-10-22',
  })),
)


export const PLAYER_BY_ID = Object.fromEntries(PLAYERS.map((player) => [player.id, player]))

export function getPlayer(id) {
  return PLAYER_BY_ID[id] ?? null
}

export function playersForTeam(teamId) {
  return PLAYERS.filter((player) => player.teamId === teamId)
}

export function teamForPlayer(playerId) {
  const player = getPlayer(playerId)
  return player ? TEAMS.find((team) => team.id === player.teamId) ?? null : null
}

export const NATIONALITIES = [...new Set(PLAYERS.map((p) => p.nationality).filter(Boolean))].sort()
