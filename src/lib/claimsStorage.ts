import { VenueClaim } from '@/types';
import fs from 'fs';
import path from 'path';

// File-based storage for serverless environments
const CLAIMS_FILE = path.join(process.cwd(), 'data', 'claims.json');

// Ensure data directory exists
const ensureDataDir = () => {
  const dataDir = path.dirname(CLAIMS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Load claims from file
const loadClaims = (): VenueClaim[] => {
  try {
    ensureDataDir();
    if (fs.existsSync(CLAIMS_FILE)) {
      const data = fs.readFileSync(CLAIMS_FILE, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error loading claims:', error);
    return [];
  }
};

// Save claims to file
const saveClaims = (claims: VenueClaim[]): void => {
  try {
    ensureDataDir();
    fs.writeFileSync(CLAIMS_FILE, JSON.stringify(claims, null, 2));
  } catch (error) {
    console.error('Error saving claims:', error);
  }
};

// Shared in-memory storage for venue claims (with file persistence)
export let venueClaims: VenueClaim[] = loadClaims();

export const addClaim = (claim: VenueClaim): void => {
  venueClaims = loadClaims(); // Reload from file to get latest data
  venueClaims.push(claim);
  saveClaims(venueClaims); // Persist to file
};

export const getClaims = (): VenueClaim[] => {
  venueClaims = loadClaims(); // Always reload from file to get latest data
  return venueClaims;
};

export const getClaimById = (id: string): VenueClaim | undefined => {
  return venueClaims.find(claim => claim.id === id);
};

export const updateClaim = (id: string, updates: Partial<VenueClaim>): VenueClaim | null => {
  venueClaims = loadClaims(); // Reload from file to get latest data
  const index = venueClaims.findIndex(claim => claim.id === id);
  if (index === -1) return null;
  
  venueClaims[index] = { ...venueClaims[index], ...updates };
  saveClaims(venueClaims); // Persist to file
  return venueClaims[index];
};

export const hasExistingClaim = (venueId: string): { exists: boolean; claim?: VenueClaim } => {
  venueClaims = loadClaims(); // Reload from file to get latest data
  const existingClaim = venueClaims.find(
    claim => claim.venueId === venueId && 
    (claim.status === 'approved' || claim.status === 'pending')
  );
  
  return {
    exists: !!existingClaim,
    claim: existingClaim
  };
};
