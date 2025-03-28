// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_slippery_cerebro.sql';
import m0001 from './0001_low_dormammu.sql';
import m0003 from './0003_overrated_misty_knight.sql';
import m0004 from './0004_giant_moondragon.sql';

  export default {
    journal,
    migrations: {
      m0000,
m0001,
m0003,
m0004
    }
  }
  