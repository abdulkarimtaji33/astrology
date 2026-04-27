-- astrology schema (no data)
-- Generated 2026-03-16T08:25:38.594Z

CREATE TABLE IF NOT EXISTS `transit_reminders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `recipientEmail` varchar(255) NOT NULL,
  `sendDate` date NOT NULL,
  `subject` varchar(500) NOT NULL,
  `placementDetails` text NOT NULL,
  `note` text DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_status_sendDate` (`status`, `sendDate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `birth_records` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `birthDate` date NOT NULL,
  `birthTime` time NOT NULL,
  `cityName` varchar(255) DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `timezone` varchar(255) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `cities` (
  `id` mediumint(8) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `state_id` mediumint(8) unsigned NOT NULL,
  `state_code` varchar(255) NOT NULL,
  `country_id` mediumint(8) unsigned NOT NULL,
  `country_code` char(2) NOT NULL,
  `type` varchar(191) DEFAULT NULL,
  `level` int(11) DEFAULT NULL,
  `parent_id` int(10) unsigned DEFAULT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `native` varchar(255) DEFAULT NULL,
  `population` bigint(20) unsigned DEFAULT NULL,
  `timezone` varchar(255) DEFAULT NULL COMMENT 'IANA timezone identifier (e.g., America/New_York)',
  `translations` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT '2014-01-01 16:01:01',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `flag` tinyint(1) NOT NULL DEFAULT 1,
  `wikiDataId` varchar(255) DEFAULT NULL COMMENT 'Rapid API GeoDB Cities',
  PRIMARY KEY (`id`),
  KEY `cities_test_ibfk_1` (`state_id`),
  KEY `cities_test_ibfk_2` (`country_id`)
) ENGINE=InnoDB AUTO_INCREMENT=160557 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=COMPACT;

CREATE TABLE `countries` (
  `id` mediumint(8) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `iso3` char(3) DEFAULT NULL,
  `numeric_code` char(3) DEFAULT NULL,
  `iso2` char(2) DEFAULT NULL,
  `phonecode` varchar(255) DEFAULT NULL,
  `capital` varchar(255) DEFAULT NULL,
  `currency` varchar(255) DEFAULT NULL,
  `currency_name` varchar(255) DEFAULT NULL,
  `currency_symbol` varchar(255) DEFAULT NULL,
  `tld` varchar(255) DEFAULT NULL,
  `native` varchar(255) DEFAULT NULL,
  `population` bigint(20) unsigned DEFAULT NULL,
  `gdp` bigint(20) unsigned DEFAULT NULL,
  `region` varchar(255) DEFAULT NULL,
  `region_id` mediumint(8) unsigned DEFAULT NULL,
  `subregion` varchar(255) DEFAULT NULL,
  `subregion_id` mediumint(8) unsigned DEFAULT NULL,
  `nationality` varchar(255) DEFAULT NULL,
  `area_sq_km` double DEFAULT NULL,
  `postal_code_format` varchar(255) DEFAULT NULL,
  `postal_code_regex` varchar(255) DEFAULT NULL,
  `timezones` text DEFAULT NULL,
  `translations` text DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `emoji` varchar(191) DEFAULT NULL,
  `emojiU` varchar(191) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `flag` tinyint(1) NOT NULL DEFAULT 1,
  `wikiDataId` varchar(255) DEFAULT NULL COMMENT 'Rapid API GeoDB Cities',
  PRIMARY KEY (`id`),
  KEY `country_continent` (`region_id`),
  KEY `country_subregion` (`subregion_id`)
) ENGINE=InnoDB AUTO_INCREMENT=251 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `houses` (
  `id` int(11) NOT NULL,
  `name` varchar(50) DEFAULT NULL,
  `main_theme` varchar(100) DEFAULT NULL,
  `represents` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `planet_relationships` (
  `planet_id` int(11) NOT NULL,
  `related_planet_id` int(11) NOT NULL,
  `is_friendly` int(11) DEFAULT NULL,
  PRIMARY KEY (`planet_id`,`related_planet_id`),
  KEY `related_planet_id` (`related_planet_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `planetary_avastha` (
  `id` int(11) NOT NULL,
  `name` varchar(50) DEFAULT NULL,
  `english_name` varchar(50) DEFAULT NULL,
  `degree_from` decimal(4,1) DEFAULT NULL,
  `degree_to` decimal(4,1) DEFAULT NULL,
  `effect_percent` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `planets` (
  `id` int(11) NOT NULL,
  `name` varchar(50) DEFAULT NULL,
  `sanskrit_name` varchar(50) DEFAULT NULL,
  `type` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `regions` (
  `id` mediumint(8) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `translations` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `flag` tinyint(1) NOT NULL DEFAULT 1,
  `wikiDataId` varchar(255) DEFAULT NULL COMMENT 'Rapid API GeoDB Cities',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `states` (
  `id` mediumint(8) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `country_id` mediumint(8) unsigned NOT NULL,
  `country_code` char(2) NOT NULL,
  `fips_code` varchar(255) DEFAULT NULL,
  `iso2` varchar(255) DEFAULT NULL,
  `iso3166_2` varchar(10) DEFAULT NULL,
  `type` varchar(191) DEFAULT NULL,
  `level` int(11) DEFAULT NULL,
  `parent_id` int(10) unsigned DEFAULT NULL,
  `native` varchar(255) DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `timezone` varchar(255) DEFAULT NULL COMMENT 'IANA timezone identifier (e.g., America/New_York)',
  `translations` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `flag` tinyint(1) NOT NULL DEFAULT 1,
  `wikiDataId` varchar(255) DEFAULT NULL COMMENT 'Rapid API GeoDB Cities',
  `population` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `country_region` (`country_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5815 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=COMPACT;

CREATE TABLE `subregions` (
  `id` mediumint(8) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `translations` text DEFAULT NULL,
  `region_id` mediumint(8) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `flag` tinyint(1) NOT NULL DEFAULT 1,
  `wikiDataId` varchar(255) DEFAULT NULL COMMENT 'Rapid API GeoDB Cities',
  PRIMARY KEY (`id`),
  KEY `subregion_continent` (`region_id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `zodiac_signs` (
  `id` int(11) NOT NULL,
  `name` varchar(50) DEFAULT NULL,
  `element` varchar(20) DEFAULT NULL,
  `modality` varchar(20) DEFAULT NULL,
  `ruled_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ruled_by` (`ruled_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `planet_house_interpretations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `planet_id` int(11) NOT NULL,
  `house_id` int(11) NOT NULL,
  `interpretation` text NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_planet_house` (`planet_id`,`house_id`),
  KEY `fk_phi_house` (`house_id`),
  CONSTRAINT `phi_planet` FOREIGN KEY (`planet_id`) REFERENCES `planets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `phi_house` FOREIGN KEY (`house_id`) REFERENCES `houses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `planet_drishti` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `planet_id` int(11) NOT NULL,
  `occupant_house_id` int(11) NOT NULL,
  `aspected_house_id` int(11) NOT NULL,
  `sort_order` tinyint(3) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_occupant_aspect` (`planet_id`,`occupant_house_id`,`aspected_house_id`),
  KEY `pd_occ` (`occupant_house_id`),
  KEY `pd_asp` (`aspected_house_id`),
  CONSTRAINT `pd_planet` FOREIGN KEY (`planet_id`) REFERENCES `planets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pd_occ` FOREIGN KEY (`occupant_house_id`) REFERENCES `houses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pd_asp` FOREIGN KEY (`aspected_house_id`) REFERENCES `houses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
