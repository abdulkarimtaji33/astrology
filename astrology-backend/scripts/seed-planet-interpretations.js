/**
 * Populates planet_house_interpretations and planet_drishti.
 * Run: node scripts/seed-planet-interpretations.js
 */
const mysql = require('mysql2/promise');

const INTERP = {
  1: {
    1: `Strong willpower, leadership, and vitality; can cause premature balding or a hot temperament.`,
    2: `Wealth through government or father; creates a bold, sometimes harsh way of speaking.`,
    3: `High bravery and success in self-made ventures; may cause friction with younger siblings.`,
    4: `High status but lacks domestic peace; property gains are possible but through struggle.`,
    5: `Sharp intellect and creative power; can cause difficulties or worry regarding children.`,
    6: `Supreme placement for "crushing" enemies, winning legal battles, and maintaining high immunity.`,
    7: `Difficult for marriage due to ego clashes; success in independent business or high-level trade.`,
    8: `Interest in secrets or the occult; risk of eye or bone issues; sudden fines or taxes.`,
    9: `Very fortunate for spiritual growth, higher education, and receiving a legacy from the father.`,
    10: `Peak career success, political power, and high social recognition (Directional Strength).`,
    11: `Wealth from many sources; powerful connections; long-lasting social influence.`,
    12: `High expenditure on travel or health; success in foreign lands but feeling "unseen" at home.`,
  },
  2: {
    1: `Magnetic personality and strong intuition; moods and health fluctuate with the lunar cycle.`,
    2: `Prosperous family life; steady liquid assets; gains through food, hospitality, or women.`,
    3: `Excellent for media, writing, and arts; many short, pleasant journeys.`,
    4: `Deep emotional contentment; gains from mother and luxury vehicles (Directional Strength).`,
    5: `High intelligence; success in counseling, education, and speculation; loving children.`,
    6: `Mental restlessness; digestive sensitivities; prone to being misunderstood by others.`,
    7: `Attractive and compassionate spouse; success in public-facing businesses or partnerships.`,
    8: `Psychological depth but prone to anxiety; fluctuating longevity; secrets regarding family.`,
    9: `Highly spiritual and lucky; gains through long-distance travel and religious teachers.`,
    10: `Public fame; changes in career path that lead to eventual popularity and respect.`,
    11: `Massive wealth through social networks; helpful friends; fulfillment of desires.`,
    12: `Strong dreams and imagination; high spending on comforts or hospitals; foreign settlement.`,
  },
  3: {
    1: `Physical strength and "go-getter" attitude; prone to scars, burns, or impulsive anger.`,
    2: `Earning power through technical skills; family disputes over money; "biting" speech.`,
    3: `Unmatchable courage; victory in sports, police, or engineering; conflict with siblings.`,
    4: `"Kuja Dosha"; tension at home; success in real estate but with legal hurdles.`,
    5: `Aggressive intellect; high energy for sports; potential for sudden losses in gambling.`,
    6: `The "Enemy Destroyer"; excellent for overcoming debt, disease, and legal rivals.`,
    7: `Intense friction in marriage; passionate but volatile partnerships; risk of business disputes.`,
    8: `Sudden accidents or surgeries; gains through inheritance or the spouse's money.`,
    9: `Conflict with father or gurus; rigid adherence to personal "rules" or dogmas.`,
    10: `Highest professional drive; administrative authority; success in fire/metal/land (Directional Strength).`,
    11: `Wealth from land and property; elder brother may be a source of both help and conflict.`,
    12: `High sexual energy; hidden enemies; financial loss through legal penalties or hospitals.`,
  },
  4: {
    1: `Intellectual, youthful, and a great communicator; excels in logic and math (Directional Strength).`,
    2: `Wealth from commerce, teaching, or writing; very persuasive and clever speech.`,
    3: `Skilled in media and technology; success in hobbies; nervous temperament.`,
    4: `Happiness through learning; a house filled with books/gadgets; gains from maternal kin.`,
    5: `Creative brilliance; success in stocks and intellectual pursuits; clever children.`,
    6: `Intellectual competition; success in auditing, medicine, or law; skin or nerve sensitivity.`,
    7: `Marriage to a witty/younger partner; success in retail or brokerage business.`,
    8: `Occult research; deep investigative skills; wealth through insurance or partner's secrets.`,
    9: `Higher education in law or commerce; religious teaching; luck through publishing.`,
    10: `High professional success in management, accounting, or media; "many-handed" career.`,
    11: `Gains through smart networking; many intellectual friends; multiple income streams.`,
    12: `Overactive imagination; loss of money through "fine print" or verbal misunderstandings.`,
  },
  5: {
    1: `Divine protection; wisdom, health, and a respectable personality (Directional Strength).`,
    2: `"Dhana Yoga"; massive savings; religious/traditional family; influential speaking.`,
    3: `Struggles in early ventures; wisdom comes through younger siblings or short travels.`,
    4: `Exceptional domestic happiness; large home; protective mother; spiritual peace.`,
    5: `"Minister-like" intellect; virtuous children; great fortune in speculative wealth.`,
    6: `Expansion of debts or liver issues; however, provides the wisdom to settle disputes.`,
    7: `Marriage to a wise, noble partner; success in consultancy or high-level law.`,
    8: `"Slow Wealth" (inheritance/spouse); long life; profound understanding of life and death.`,
    9: `Best placement for luck; world travel; spiritual leadership; grace of the father.`,
    10: `Respectable but slow-rising career; success as a teacher, judge, or advisor.`,
    11: `The "Cash Flow" house; gains from every direction; virtuous and wealthy friends.`,
    12: `Spiritual detachment; high spending on charity/temples; "sleeping" wisdom.`,
  },
  6: {
    1: `Beautiful appearance; love for luxury and arts; very popular with the opposite sex.`,
    2: `Wealth from luxury goods, fashion, or gems; very sweet and attractive speech.`,
    3: `Artistic siblings; success in creative arts and decoration; pleasant short trips.`,
    4: `High-end vehicles and a beautiful, decorated home; deep motherly affection.`,
    5: `Love for romance and cinema; success in smart investments and artistic hobbies.`,
    6: `"Weak" for health (kidneys/sugar); but can win over enemies through charm.`,
    7: `Early, happy marriage; beautiful spouse; success in luxury-based partnerships.`,
    8: `Gains through marriage/legacy; deep attraction to hidden mysteries; long life.`,
    9: `Luck through women; spiritual arts; travels for pleasure and luxury.`,
    10: `Success in beauty, fashion, media, or hotel industries; a pleasant workspace.`,
    11: `Material abundance; socialite life; gains through jewelry or artistic ventures.`,
    12: `"The Bedroom" house; maximum material pleasure and luxury travel; high spending.`,
  },
  7: {
    1: `Serious, hardworking, but slow life starts; prone to melancholy or physical bone issues.`,
    2: `Financial struggle in youth; harsh/truthful speech; family responsibilities are heavy.`,
    3: `Exceptional stamina; victory over obstacles after age 36; disciplined mind.`,
    4: `Lack of emotional warmth; burdens regarding house/property; mother is strict.`,
    5: `Delayed children; serious intellect; loss through gambling or hasty speculation.`,
    6: `Excellent for service-based jobs; long-term protection from enemies; hardworking.`,
    7: `Mature spouse; stable but late marriage; success in construction or oil business.`,
    8: `Very long life; chronic/slow-healing health issues; delays in receiving inheritance.`,
    9: `Philosophical but struggles with religious "norms"; distance from father; slow luck.`,
    10: `Rise to the top through "blood, sweat, and tears"; high career stability after 36.`,
    11: `The "Fixed Wealth" house; steady, permanent income; very few but loyal friends.`,
    12: `Seclusion and solitude; high secret losses; "karmic" debts to settle.`,
  },
  8: {
    3: `Modern media/tech success; massive courage; unconventional path to victory.`,
    6: `"Mlechha" success; winning through loopholes; modern medicine; immune to scandals.`,
    10: `Sudden fame; unconventional career; success in politics or foreign companies.`,
    11: `"The Obsession for Gains"; massive, sudden wealth from multiple foreign sources.`,
  },
  9: {
    3: `Deep psychic intuition; strange relation with siblings; victory through silence.`,
    6: `Mastery over hidden enemies; success in spiritual healing or alternative medicine.`,
    12: `"Moksha Karaka"; the primary placement for final spiritual liberation and enlightenment.`,
  },
};

const MARS_OCC = {
  1: [4, 7, 8],
  2: [5, 8, 9],
  3: [6, 9, 10],
  4: [7, 10, 11],
  5: [8, 11, 12],
  6: [9, 12, 1],
  7: [10, 1, 2],
  8: [11, 2, 3],
  9: [12, 3, 4],
  10: [1, 4, 5],
  11: [2, 5, 6],
  12: [3, 6, 7],
};

function kthFrom(occ, k) {
  return ((occ + k - 2) % 12) + 1;
}

function sevents(occ) {
  return kthFrom(occ, 7);
}

function p579(occ) {
  return [kthFrom(occ, 5), kthFrom(occ, 7), kthFrom(occ, 9)];
}

function s3710(occ) {
  return [kthFrom(occ, 3), kthFrom(occ, 7), kthFrom(occ, 10)];
}

const DDL = `
CREATE TABLE IF NOT EXISTS \`planet_house_interpretations\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`planet_id\` int(11) NOT NULL,
  \`house_id\` int(11) NOT NULL,
  \`interpretation\` text NOT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_planet_house\` (\`planet_id\`,\`house_id\`),
  KEY \`fk_phi_house\` (\`house_id\`),
  CONSTRAINT \`phi_planet\` FOREIGN KEY (\`planet_id\`) REFERENCES \`planets\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`phi_house\` FOREIGN KEY (\`house_id\`) REFERENCES \`houses\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS \`planet_drishti\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`planet_id\` int(11) NOT NULL,
  \`occupant_house_id\` int(11) NOT NULL,
  \`aspected_house_id\` int(11) NOT NULL,
  \`sort_order\` tinyint(3) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_occupant_aspect\` (\`planet_id\`,\`occupant_house_id\`,\`aspected_house_id\`),
  KEY \`pd_occ\` (\`occupant_house_id\`),
  KEY \`pd_asp\` (\`aspected_house_id\`),
  CONSTRAINT \`pd_planet\` FOREIGN KEY (\`planet_id\`) REFERENCES \`planets\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`pd_occ\` FOREIGN KEY (\`occupant_house_id\`) REFERENCES \`houses\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`pd_asp\` FOREIGN KEY (\`aspected_house_id\`) REFERENCES \`houses\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`;

async function main() {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_DATABASE || 'astrology',
    multipleStatements: true,
  });

  await c.query(DDL);

  await c.query('SET FOREIGN_KEY_CHECKS=0');
  await c.query('TRUNCATE TABLE planet_drishti');
  await c.query('TRUNCATE TABLE planet_house_interpretations');
  await c.query('SET FOREIGN_KEY_CHECKS=1');

  const houses = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const interpRows = [];
  for (const [pidStr, byHouse] of Object.entries(INTERP)) {
    const pid = parseInt(pidStr, 10);
    for (const [hidStr, text] of Object.entries(byHouse)) {
      const hid = parseInt(hidStr, 10);
      interpRows.push([pid, hid, text]);
    }
  }
  await c.query(
    'INSERT INTO planet_house_interpretations (planet_id, house_id, interpretation) VALUES ?',
    [interpRows],
  );

  const drishti = [];
  const add = (pid, occ, aspects, startOrder = 0) => {
    aspects.forEach((asp, i) => {
      drishti.push([pid, occ, asp, startOrder + i]);
    });
  };
  for (const pid of [1, 2, 4, 6]) {
    for (const occ of houses) {
      add(pid, occ, [sevents(occ)], 0);
    }
  }
  for (const occ of houses) {
    add(3, occ, MARS_OCC[occ], 0);
  }
  for (const pid of [5, 8, 9]) {
    for (const occ of houses) {
      add(pid, occ, p579(occ), 0);
    }
  }
  for (const occ of houses) {
    add(7, occ, s3710(occ), 0);
  }

  await c.query(
    'INSERT INTO planet_drishti (planet_id, occupant_house_id, aspected_house_id, sort_order) VALUES ?',
    [drishti],
  );

  const [ic] = await c.query('SELECT COUNT(*) c FROM planet_house_interpretations');
  const [dc] = await c.query('SELECT COUNT(*) c FROM planet_drishti');
  console.log('Inserted planet_house_interpretations:', ic[0].c, 'planet_drishti:', dc[0].c);
  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
