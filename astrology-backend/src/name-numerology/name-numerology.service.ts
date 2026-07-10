import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { calculateNameNumber, NUMBER_MEANING } from '../astrology/numerology';

export interface NameNumerologyResult {
  name: string;
  compound: number;
  single: number;
  meaning: { title: string; keywords: string };
}

export interface DomainCheckResult {
  domain: string;
  available: boolean | null;
  error?: string;
}

/** Lowercase alphanumeric-hyphen label suitable for a domain name, max 63 chars. */
export function sanitizeDomainLabel(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);
}

@Injectable()
export class NameNumerologyService {
  private readonly logger = new Logger(NameNumerologyService.name);

  calculate(name: string): NameNumerologyResult {
    if (!name?.trim()) {
      throw new BadRequestException('name is required');
    }
    const { compound, single } = calculateNameNumber(name);
    if (compound === 0) {
      throw new BadRequestException('name must contain at least one letter');
    }
    return {
      name: name.trim(),
      compound,
      single,
      meaning: NUMBER_MEANING[single] ?? NUMBER_MEANING[1],
    };
  }

  async checkDomain(name: string): Promise<DomainCheckResult> {
    const label = sanitizeDomainLabel(name);
    if (!label) {
      throw new BadRequestException('name does not produce a valid domain label');
    }
    const domain = `${label}.com`;

    try {
      const res = await fetch(`https://rdap.verisign.com/com/v1/domain/${domain}`, {
        signal: AbortSignal.timeout(8000),
      });
      if (res.status === 404) {
        return { domain, available: true };
      }
      if (res.ok) {
        return { domain, available: false };
      }
      this.logger.warn(`checkDomain: unexpected RDAP status ${res.status} for ${domain}`);
      return { domain, available: null, error: `Registry lookup returned ${res.status}` };
    } catch (err) {
      this.logger.warn(`checkDomain: lookup failed for ${domain}: ${(err as Error).message}`);
      return { domain, available: null, error: 'Registry lookup failed' };
    }
  }
}
