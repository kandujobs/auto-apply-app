// Resume parsing and text cleaning utilities

export interface ResumeSection {
  title: string;
  fields: { label: string; value: string }[];
}

// Clean up extracted text (remove @, ligatures, stray symbols)
export function cleanExtractedText(text: string): string {
  return text
    .replace(/@/g, 'a')
    .replace(/ﬁ/g, 'fi')
    .replace(/ﬂ/g, 'fl')
    // Remove stray non-ASCII symbols (optional)
    .replace(/[^\u0000-\u007F]+/g, '')
    .replace(/ +/g, ' ');
}

// Normalize spacing: preserve line breaks, clean up blank lines and spaces
export function normalizeSpacing(text: string): string {
  return text
    .replace(/\n{3,}/g, '\n\n') // Collapse 3+ blank lines to 2
    .replace(/ {2,}/g, ' ') // Collapse multiple spaces
    .split('\n').map(line => line.trimEnd()).join('\n');
}

// Heuristically improve line breaks
export function smartLineBreaks(text: string): string {
  return text
    // Insert line break after period and before capital letter
    .replace(/([a-z])\. ([A-Z])/g, '$1.\n$2')
    // Insert line break before bullets
    .replace(/([•\-*]) /g, '\n$1 ')
    // Insert line break at pipes (|) used as delimiters
    .replace(/\| /g, '\n')
    // Remove extra blank lines
    .replace(/\n{2,}/g, '\n');
}

// Fix common split words (e.g., 'fi nancial' -> 'financial')
export function fixSplitWords(text: string): string {
  return text
    .replace(/fi nance/g, 'finance')
    .replace(/fi nancial/g, 'financial')
    .replace(/pro fi t/g, 'profit')
    .replace(/analy sis/g, 'analysis')
    .replace(/opera tions/g, 'operations')
    .replace(/commu nication/g, 'communication')
    .replace(/orga nization/g, 'organization')
    .replace(/edu cation/g, 'education')
    .replace(/cer tification/g, 'certification')
    .replace(/expe rience/g, 'experience')
    .replace(/cus tomer/g, 'customer')
    .replace(/mana gement/g, 'management')
    .replace(/col laboration/g, 'collaboration')
    .replace(/ana lytical/g, 'analytical')
    .replace(/logis tics/g, 'logistics')
    .replace(/mar ket/g, 'market')
    .replace(/re search/g, 'research')
    .replace(/strat egy/g, 'strategy')
    .replace(/ser vice/g, 'service')
    .replace(/pro ject/g, 'project')
    .replace(/lead ership/g, 'leadership')
    .replace(/orga nizational/g, 'organizational')
    .replace(/ac count/g, 'account')
    .replace(/de velopment/g, 'development')
    .replace(/solu tion/g, 'solution')
    .replace(/pre sentation/g, 'presentation')
    .replace(/tech nical/g, 'technical')
    .replace(/pro gram/g, 'program')
    .replace(/infor mation/g, 'information')
    .replace(/pro cess/g, 'process')
    .replace(/appli cation/g, 'application')
    .replace(/resu me/g, 'resume');
}

// Aggressively fix ligature splits, double letters, and problematic word fragments
export function fixLigaturesAndSplits(text: string): string {
  return text
    // Double letters and ligatures
    .replace(/f f/g, 'ff')
    .replace(/f i/g, 'fi')
    .replace(/f l/g, 'fl')
    .replace(/t i/g, 'ti')
    .replace(/t t/g, 'tt')
    // Common problematic words/fragments
    .replace(/B u f f a l o/g, 'Buffalo')
    .replace(/E d u c a \+ o n/g, 'Education')
    .replace(/\+ /g, 't')
    .replace(/communica a on/g, 'communication')
    .replace(/analy cal/g, 'analytical')
    .replace(/Col labora on/g, 'Collaboration')
    .replace(/sta ff/g, 'staff')
    .replace(/ a on/g, 'ation')
    .replace(/ a al/g, 'atal')
    .replace(/ a ve/g, 'ative')
    .replace(/ a ent/g, 'ation')
    .replace(/ a or/g, 'ator')
    .replace(/ a ed/g, 'ated')
    .replace(/ a ing/g, 'ating')
    .replace(/ a ive/g, 'ative')
    .replace(/ a ion/g, 'ation')
    .replace(/ a ons/g, 'ations')
    .replace(/ a ons/g, 'ations')
    .replace(/ a onal/g, 'ational')
    .replace(/ a ional/g, 'ational')
    .replace(/ a ional/g, 'ational')
    // Remove stray spaces in common suffixes
    .replace(/tion/g, 'tion')
    .replace(/ff/g, 'ff')
    // Add more as needed
    ;
}

// Helper: Extract date at end of line (e.g., '... June 2021', '... 2019–2023', '... Present')
function extractDateAtEnd(line: string): { main: string, date: string | null } {
  const datePattern = /(,?\s*(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t)?(?:ember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?|Spring|Fall|Summer|Winter)?\s?\d{4}(?:[\-–]\s?(?:Present|\d{4}))?|Present)$/i;
  const match = line.match(datePattern);
  if (match && match.index !== undefined && match.index > 0) {
    return { main: line.slice(0, match.index).replace(/[,\s]+$/, ''), date: match[0].replace(/^,?\s*/, '') };
  }
  return { main: line, date: null };
}

// Helper: Combine city/state if location ends with comma and next word is state
function combineLocation(parts: string[]): string {
  if (parts.length >= 2 && /^[A-Z]{2}$/.test(parts[parts.length - 1].trim())) {
    return parts.slice(0, -1).join(', ') + ', ' + parts[parts.length - 1].trim();
  }
  return parts.join(', ');
}

// Helper: Extract start/end dates from a date range string
function extractDateRange(line: string): { start?: string, end?: string } {
  // Match (9/2024 current), (9/2023 5/2024), (09/2023 05/2024), etc.
  const parenPattern = /\((\d{1,2})[\/\-](\d{4})\s+(current|\d{1,2}[\/\-]\d{4})\)/i;
  const matchParen = line.match(parenPattern);
  if (matchParen) {
    const startMonth = matchParen[1].padStart(2, '0');
    const startYear = matchParen[2];
    const endRaw = matchParen[3];
    const start = `${startYear}-${startMonth}`;
    let end = '';
    if (/current/i.test(endRaw)) end = 'Present';
    else if (/\d{1,2}[\/\-]\d{4}/.test(endRaw)) {
      const [endMonth, endYear] = endRaw.split(/[\/\-]/);
      end = `${endYear}-${endMonth.padStart(2, '0')}`;
    }
    return { start, end };
  }
  // Also support (9/2024), (current), (5/2024), etc.
  const singleParenPattern = /\((current|\d{1,2}[\/\-]\d{4})\)/i;
  const matchSingle = line.match(singleParenPattern);
  if (matchSingle) {
    const val = matchSingle[1];
    if (/current/i.test(val)) return { end: 'Present' };
    const [month, year] = val.split(/[\/\-]/);
    return { end: `${year}-${month.padStart(2, '0')}` };
  }
  // Fallback to previous logic
  const rangePattern = /([A-Za-z]+ \d{4})\s*[\-–—]+\s*(Present|[A-Za-z]+ \d{4})/i;
  const match = line.match(rangePattern);
  if (match) {
    return { start: match[1], end: match[2] };
  }
  return {};
}

function isDateString(line: string): boolean {
  return /^(Present|Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t)?(?:ember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?|Spring|Fall|Summer|Winter)? ?\d{4}$/.test(line.trim());
}

// Add a helper to check for strong label patterns
function isStrongLabel(line: string): boolean {
  return /^((Job Title|Company|Location|Dates?|Degree|School|Issuer|Certification|Role|Organization|Field|Institution|GPA|Project Title|Description|Summary|Email|Phone|LinkedIn|Skills|Start Date|End Date|Graduation|Major|Headline|Position|Employer|University|College|School):)/i.test(line.trim());
}

// --- Section Header Patterns ---
const sectionHeaderPatterns = [
  { key: 'header', patterns: [/^(header|contact( information)?|personal details?)$/i] },
  { key: 'summary', patterns: [/^(professional )?(summary|objective|profile)$/i] },
  { key: 'education', patterns: [/^education( history)?$/i] },
  { key: 'experience', patterns: [/^(work|professional)? ?experience$/i, /^relevant experience$/i] },
  { key: 'skills', patterns: [/^skills?$/i, /^(technical|soft) skills$/i] },
  { key: 'projects', patterns: [/^projects?$/i] },
  { key: 'certifications', patterns: [/^certifications?$/i] },
  { key: 'activities', patterns: [/^activities$/i, /^extracurricular/i] },
  { key: 'other', patterns: [/^other$/i] },
];

function detectSectionKey(line: string): string | null {
  for (const { key, patterns } of sectionHeaderPatterns) {
    for (const pat of patterns) {
      if (pat.test(line.trim())) return key;
    }
  }
  // Treat any ALL CAPS line (not a bullet) as a section header
  const trimmed = line.trim();
  if (
    trimmed.length > 2 &&
    trimmed === trimmed.toUpperCase() &&
    /^[A-Z0-9 .,&\-]+$/.test(trimmed) &&
    !/^([•\-*])\s?/.test(trimmed)
  ) {
    if (/EXPERIENCE/.test(trimmed) && !/EDUCATION/.test(trimmed)) return 'experience';
    return trimmed.toLowerCase(); // Use the header text as the key
  }
  return null;
}

// --- Section-Specific Parsers ---
function parseHeaderSection(lines: string[]): any {
  const result: any = {};
  for (const line of lines) {
    if (/^([A-Z][a-z]+\s){1,3}[A-Z][a-z]+$/.test(line.trim())) result['Full Name'] = line.trim();
    else if (/\b\d{3}[\-\.\s]?\d{3}[\-\.\s]?\d{4}\b/.test(line)) result['Phone Number'] = line.trim();
    else if (/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/.test(line)) result['Email'] = line.trim();
    else if (/linkedin\.com\//i.test(line)) result['LinkedIn'] = line.trim();
    else if (/\b[A-Z][a-z]+,? [A-Z]{2}\b/.test(line)) result['City, State'] = line.trim();
  }
  return result;
}

function parseSummarySection(lines: string[]): any {
  return { Summary: lines.join(' ') };
}

function parseEducationSection(lines: string[]): any[] {
  const entries: any[] = [];
  let entry: any = {};
  let lastLineWasDate = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const range = extractDateRange(line);
    if (range.start && range.end) {
      entry['start_date'] = range.start;
      entry['end_date'] = range.end;
      entry['Graduation'] = `${range.start} – ${range.end}`;
      lastLineWasDate = true;
      continue;
    }
    if (isDateString(line) && entry['Graduation'] && !entry['end_date'] && lastLineWasDate) {
      entry['end_date'] = line.trim();
      entry['Graduation'] = `${entry['Graduation']} – ${line.trim()}`;
      lastLineWasDate = true;
      continue;
    }
    if (isDateString(line)) {
      entry['end_date'] = line.trim();
      entry['Graduation'] = line.trim();
      lastLineWasDate = true;
      continue;
    }
    const { main, date } = extractDateAtEnd(line);
    if (/bachelor|master|phd|associate|degree/i.test(line)) entry['degree'] = main;
    else if (/university|college|school|institution/i.test(line)) entry['institution'] = main;
    else if (/gpa/i.test(line)) entry['gpa'] = main.match(/\d+\.\d+/)?.[0];
    else if (/coursework/i.test(line)) entry['field'] = main;
    else if (/location/i.test(line)) entry['location'] = main;
    if (date) entry['end_date'] = date;
    if (Object.keys(entry).length > 0 && i === lines.length - 1) { entries.push(entry); entry = {}; }
    lastLineWasDate = false;
  }
  if (Object.keys(entry).length > 0) entries.push(entry);
  return entries;
}

function isJobEntryLine(line: string): boolean {
  // Strong job entry: must have at least one comma and a date
  return /,/.test(line) && /(\d{4}|Present)/.test(line);
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function parseExperienceSection(lines: string[]): any[] {
  const entries: any[] = [];
  let entry: any = null;
  let lastLineWasDate = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Handle 'Job Title, Company (9/2023 current)' pattern
    const jobParenPattern = /^(.+?),\s*(.+?)\s*\(([^)]+)\)$/;
    const jobParenMatch = line.match(jobParenPattern);
    if (jobParenMatch) {
      if (entry) entries.push(entry);
      const jobTitle = jobParenMatch[1].trim();
      const company = jobParenMatch[2].trim();
      const dateRange = jobParenMatch[3].trim();
      const { start, end } = extractDateRange(`(${dateRange})`);
      entry = { 'job_title': jobTitle, 'company': company };
      if (start) entry['start_date'] = start;
      if (end && !/present/i.test(end)) entry['end_date'] = end;
      lastLineWasDate = true;
      continue;
    }
    const range = extractDateRange(line);
    if (range.start && range.end) {
      if (entry) entries.push(entry);
      entry = { start_date: range.start, end_date: range.end };
      lastLineWasDate = true;
      continue;
    }
    if (/^([•\-*])\s?/.test(line)) {
      const bullet = line.replace(/^([•\-*])\s?/, '');
      if (/^present$/i.test(bullet) && entry) {
        lastLineWasDate = true;
        continue;
      }
      if (isDateString(bullet) && entry && entry.start_date && !entry.end_date) {
        entry.end_date = bullet;
        lastLineWasDate = true;
        continue;
      }
      if (entry) {
        if (!entry.bullets) entry.bullets = [];
        entry.bullets.push(bullet);
      }
      lastLineWasDate = false;
      continue;
    }
    if (/^present$/i.test(line) && entry) {
      lastLineWasDate = true;
      continue;
    }
    const { main, date } = extractDateAtEnd(line);
    let parts = main.split(',').map(s => s.trim()).filter(Boolean);
    if (isDateString(line) && entry && !entry.end_date && lastLineWasDate) {
      if (!/present/i.test(line.trim())) entry.end_date = line.trim();
      lastLineWasDate = true;
      continue;
    }
    if (isDateString(line)) {
      if (entry) entries.push(entry);
      entry = { start_date: line.trim() };
      lastLineWasDate = true;
      continue;
    }
    if (isJobEntryLine(line)) {
      if (entry) entries.push(entry);
      entry = { 'job_title': parts[0] || '', 'company': parts[1] || '' };
      if (parts.length > 2) entry['location'] = parts.slice(2).join(', ');
      if (date && !/present/i.test(date)) entry['end_date'] = date;
      lastLineWasDate = false;
    } else if (entry) {
      if (!entry.description) entry.description = line;
      else entry.description += ' ' + line;
      lastLineWasDate = false;
    }
  }
  if (entry) entries.push(entry);
  return entries;
}

function parseSkillsSection(lines: string[]): any {
  // Group by type if possible
  const skills: any = { Skills: [] };
  let currentType = null;
  for (const line of lines) {
    if (/software|programming|languages|tools/i.test(line)) {
      currentType = line.trim();
      skills[currentType] = [];
    } else if (currentType) {
      skills[currentType].push(...line.split(/[,;•]/).map(s => s.trim()).filter(Boolean));
    } else {
      skills.Skills.push(...line.split(/[,;•]/).map(s => s.trim()).filter(Boolean));
    }
  }
  return skills;
}

function parseProjectsSection(lines: string[]): any[] {
  const entries: any[] = [];
  let entry: any = {};
  for (const line of lines) {
    const { main, date } = extractDateAtEnd(line);
    if (!entry['Project Title']) entry['Project Title'] = main;
    else if (!entry.Description) entry.Description = main;
    else entry.Description += ' ' + main;
    if (date) entry['Date'] = date;
    if (Object.keys(entry).length > 1) { entries.push(entry); entry = {}; }
  }
  if (Object.keys(entry).length > 0) entries.push(entry);
  return entries;
}

function parseCertificationsSection(lines: string[]): any[] {
  const entries: any[] = [];
  for (const line of lines) {
    const { main, date } = extractDateAtEnd(line);
    let parts = main.split(',').map(s => s.trim()).filter(Boolean);
    let entry: any = {};
    if (parts.length >= 2) {
      entry['Certification'] = parts[0];
      entry['Issuer'] = parts[1];
    } else {
      entry['Certification'] = main;
    }
    if (date) entry['Date'] = date;
    entries.push(entry);
  }
  return entries;
}

function parseActivitiesSection(lines: string[]): any[] {
  const entries: any[] = [];
  let entry: any = null;
  let lastLineWasDate = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Handle 'Role, Organization (9/2023 current)' pattern
    const roleParenPattern = /^(.+?),\s*(.+?)\s*\(([^)]+)\)$/;
    const roleParenMatch = line.match(roleParenPattern);
    if (roleParenMatch) {
      if (entry) entries.push(entry);
      const role = roleParenMatch[1].trim();
      const org = roleParenMatch[2].trim();
      const dateRange = roleParenMatch[3].trim();
      const { start, end } = extractDateRange(`(${dateRange})`);
      entry = { 'Role': role, 'Organization': org };
      if (start) entry['Dates'] = start;
      if (end) entry['EndDate'] = end;
      if (end && /present/i.test(end)) entry['current'] = true;
      lastLineWasDate = true;
      continue;
    }
    const range = extractDateRange(line);
    if (range.start && range.end) {
      if (entry) entries.push(entry);
      entry = { Dates: `${range.start} – ${range.end}` };
      if (range.end.toLowerCase() === 'present') {
        entry.current = true;
        entry.endDate = getCurrentMonth();
      }
      lastLineWasDate = true;
      continue;
    }
    if (/^([•\-*])\s?/.test(line)) {
      const bullet = line.replace(/^([•\-*])\s?/, '');
      if (/^present$/i.test(bullet) && entry) {
        entry.current = true;
        entry.endDate = getCurrentMonth();
        lastLineWasDate = true;
        continue; // Do not add as bullet
      }
      if (isDateString(bullet) && entry && entry.Dates && !entry.EndDate) {
        entry.EndDate = bullet;
        entry.Dates = `${entry.Dates} – ${bullet}`;
        lastLineWasDate = true;
        continue;
      }
      if (entry) {
        if (!entry.Bullets) entry.Bullets = [];
        entry.Bullets.push(bullet);
      }
      lastLineWasDate = false;
      continue;
    }
    if (/^present$/i.test(line) && entry) {
      entry.current = true;
      entry.endDate = getCurrentMonth();
      lastLineWasDate = true;
      continue;
    }
    if (isDateString(line) && entry && !entry.EndDate && lastLineWasDate) {
      entry.EndDate = line.trim();
      entry.Dates = `${entry.Dates} – ${line.trim()}`;
      lastLineWasDate = true;
      continue;
    }
    const { main, date } = extractDateAtEnd(line);
    let parts = main.split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      if (entry) entries.push(entry);
      entry = { 'Role': parts[0], 'Organization': parts[1] };
      if (parts.length > 2) entry['Location'] = parts.slice(2).join(', ');
      if (date) entry['Dates'] = date;
      lastLineWasDate = false;
    } else if (entry) {
      // Append to Description
      if (!entry.Description) entry.Description = line;
      else entry.Description += ' ' + line;
      lastLineWasDate = false;
    }
  }
  if (entry) entries.push(entry);
  return entries;
}

function parseOtherSection(lines: string[]): any {
  return { Details: lines };
}

// Add a profile section parser
function parseProfileSection(lines: string[]): any {
  const result: any = {};
  for (const line of lines) {
    const parts = line.split(/[,|]/).map(p => p.trim()).filter(Boolean);
    for (const part of parts) {
      const trimmed = part;
      if (!trimmed) continue;
      // Name: first non-empty part, likely with 2+ words, all capitalized
      if (!result['Full Name'] && /^[A-Z][a-z]+( [A-Z][a-z]+)+$/.test(trimmed)) {
        result['Full Name'] = trimmed;
        continue;
      }
      // Email
      if (/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/.test(trimmed)) {
        result['Email'] = trimmed.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/)![0];
        continue;
      }
      // Phone (match (123) 456-7890, 123-456-7890, 123.456.7890, 123 456 7890, etc.)
      if (/((\(\d{3}\)\s*)|(\d{3}[\-\.\s]))?\d{3}[\-\.\s]?\d{3,4}/.test(trimmed)) {
        const phoneMatch = trimmed.match(/((\(\d{3}\)\s*)|(\d{3}[\-\.\s]))?\d{3}[\-\.\s]?\d{3,4}/);
        if (phoneMatch) result['Phone'] = phoneMatch[0];
        continue;
      }
      // LinkedIn
      if (/linkedin\.com\//i.test(trimmed)) {
        result['LinkedIn'] = trimmed;
        continue;
      }
      // Address (city, state or similar)
      if (!result['Address'] && /[A-Za-z]+,? [A-Z]{2}/.test(trimmed)) {
        result['Address'] = trimmed;
        continue;
      }
      // Website
      if (!result['Website'] && /https?:\/\//.test(trimmed) && !/linkedin\.com\//i.test(trimmed)) {
        result['Website'] = trimmed;
        continue;
      }
    }
  }
  return result;
}

// --- Main Category-First Parser ---
export function parseResumeSections(text: string): ResumeSection[] {
  const lines = text.split(/\r?\n/).map(l => l.trim());
  let sections: ResumeSection[] = [];
  let currentSectionKey: string | null = null;
  let currentSectionLines: string[] = [];
  let profileLines: string[] = [];
  let foundFirstSection = false;
  let allExperienceLines: string[] = [];
  let experienceSectionIndices: number[] = [];

  function pushSection() {
    if (!currentSectionKey) return;
    if (currentSectionKey === 'experience') {
      // Instead of pushing, collect all experience lines
      allExperienceLines.push(...currentSectionLines);
      experienceSectionIndices.push(sections.length); // Track where experience would have been
      return;
    }
    let parsed;
    switch (currentSectionKey) {
      case 'profile': parsed = parseProfileSection(currentSectionLines); break;
      case 'header': parsed = parseHeaderSection(currentSectionLines); break;
      case 'summary': parsed = parseSummarySection(currentSectionLines); break;
      case 'education': parsed = parseEducationSection(currentSectionLines); break;
      case 'skills': parsed = parseSkillsSection(currentSectionLines); break;
      case 'projects': parsed = parseProjectsSection(currentSectionLines); break;
      case 'certifications': parsed = parseCertificationsSection(currentSectionLines); break;
      case 'activities': parsed = parseActivitiesSection(currentSectionLines); break;
      case 'other': parsed = parseOtherSection(currentSectionLines); break;
      default: parsed = parseOtherSection(currentSectionLines); break;
    }
    sections.push({ title: currentSectionKey.charAt(0).toUpperCase() + currentSectionKey.slice(1), fields: Array.isArray(parsed) ? parsed.flatMap(obj => Object.entries(obj).map(([label, value]) => ({ label, value: value == null ? '' : String(value) }))) : Object.entries(parsed).map(([label, value]) => ({ label, value: value == null ? '' : String(value) })) });
  }

  for (const line of lines) {
    const detected = detectSectionKey(line);
    if (!foundFirstSection && !detected) {
      profileLines.push(line);
      continue;
    }
    if (!foundFirstSection && detected) {
      // Push profile section if any lines collected
      if (profileLines.filter(l => l.trim()).length > 0) {
        sections.push({
          title: 'Profile',
          fields: Object.entries(parseProfileSection(profileLines)).map(([label, value]) => ({ label, value: value == null ? '' : String(value) }))
        });
      }
      foundFirstSection = true;
    }
    if (detected) {
      pushSection();
      currentSectionKey = detected;
      currentSectionLines = [];
    } else {
      currentSectionLines.push(line);
    }
  }
  pushSection();

  // After all sections, if any experience lines were found, add a single Experience section
  if (allExperienceLines.length > 0) {
    const parsed = parseExperienceSection(allExperienceLines);
    sections.push({
      title: 'Experience',
      fields: Array.isArray(parsed)
        ? parsed.flatMap(obj => Object.entries(obj).map(([label, value]) => ({ label, value: value == null ? '' : String(value) })))
        : Object.entries(parsed).map(([label, value]) => ({ label, value: value == null ? '' : String(value) }))
    });
    // Remove all previously tracked experience section placeholders
    sections = sections.filter((_, idx) => !experienceSectionIndices.includes(idx));
  }
  return sections;
}

// Main function to clean and parse resume text
export function parseAndCleanResume(text: string): { raw: string, parsed: ResumeSection[] } {
  const cleanedText = cleanExtractedText(text);
  const normalizedText = normalizeSpacing(cleanedText);
  const lineBrokenText = smartLineBreaks(normalizedText);
  const fixedWordsText = fixSplitWords(lineBrokenText);
  const ligatureFixedText = fixLigaturesAndSplits(fixedWordsText);
  return {
    raw: ligatureFixedText,
    parsed: ligatureFixedText ? parseResumeSections(ligatureFixedText) : []
  };
} 