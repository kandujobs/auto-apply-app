import { Job } from '../types/Job';
import { UserProfile } from '../types/Profile';

/**
 * Calculates a fit score between a job and a user profile.
 * The score is based on matching the job's title, requirements, and tags
 * with the user's experience titles, skills, and other relevant fields.
 * Returns a number between 0 and 1 (higher is better fit).
 */
// Defensive toLowerCase utility
const safeToLower = (val: any) => typeof val === 'string' ? val.toLowerCase() : '';

export function calculateFitScore(job: Job, profile: UserProfile): number {
  let score = 0;
  let maxScore = 3; // title, requirements, tags

  // 1. Title match (job title vs. experience titles and headline)
  const jobTitle = safeToLower(job.title);
  const experienceTitles = profile.experience.map(exp => safeToLower(exp.title));
  const headline = safeToLower(profile.headline);
  if (experienceTitles.some(title => jobTitle.includes(title) || title.includes(jobTitle)) || headline.includes(jobTitle)) {
    score += 1;
  }

  // 2. Requirements match (job requirements vs. user skills)
  const userSkills = profile.skills.map(skill => safeToLower(skill));
  const requirements = (job.requirements || []).map(req => safeToLower(req));
  const matchedRequirements = requirements.filter(req => userSkills.some(skill => req.includes(skill) || skill.includes(req)));
  if (requirements.length > 0) {
    score += Math.min(1, matchedRequirements.length / requirements.length);
  }

  // 3. Tags match (job tags vs. user skills)
  const jobTags = (job.tags || []).map(tag => safeToLower(tag));
  const matchedTags = jobTags.filter(tag => userSkills.includes(tag));
  if (jobTags.length > 0) {
    score += Math.min(1, matchedTags.length / jobTags.length);
  }

  // Normalize score to 0-1
  return score / maxScore;
} 