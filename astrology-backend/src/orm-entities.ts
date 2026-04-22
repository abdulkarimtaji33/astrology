import { BirthRecord } from './birth-records/birth-record.entity';
import { AiAnalysis } from './birth-records/ai-analysis.entity';
import { City } from './cities/city.entity';
import { House } from './entities/house.entity';
import { Planet } from './entities/planet.entity';
import { PlanetRelationship } from './entities/planet-relationship.entity';
import { PlanetaryAvastha } from './entities/planetary-avastha.entity';
import { ZodiacSign } from './entities/zodiac-sign.entity';
import { PlanetHouseInterpretation } from './entities/planet-house-interpretation.entity';
import { PlanetDrishti } from './entities/planet-drishti.entity';
import { GeoRegion } from './entities/region.entity';
import { Subregion } from './entities/subregion.entity';
import { Country } from './entities/country.entity';
import { State } from './entities/state.entity';

export const ORM_ENTITIES = [
  BirthRecord,
  AiAnalysis,
  City,
  House,
  Planet,
  PlanetRelationship,
  PlanetaryAvastha,
  ZodiacSign,
  PlanetHouseInterpretation,
  PlanetDrishti,
  GeoRegion,
  Subregion,
  Country,
  State,
];
