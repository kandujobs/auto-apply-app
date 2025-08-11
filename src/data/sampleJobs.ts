import { Job } from '../types/Job';

interface Question {
  id: string;
  question: string;
  type: 'text' | 'textarea' | 'select';
  options?: string[];
  required?: boolean;
}

interface ExtendedJob extends Job {
  requiresInput?: boolean;
  additionalQuestions?: Question[];
  lat: number;
  lng: number;
}

export const NY_CITY_COORDS: { [city: string]: { lat: number; lng: number } } = {
  "New York, NY": { lat: 40.7128, lng: -74.0060 },
  "Buffalo, NY": { lat: 42.8864, lng: -78.8784 },
  "Rochester, NY": { lat: 43.1566, lng: -77.6088 },
  "Yonkers, NY": { lat: 40.9312, lng: -73.8988 },
  "Syracuse, NY": { lat: 43.0481, lng: -76.1474 },
  "Albany, NY": { lat: 42.6526, lng: -73.7562 },
  "New Rochelle, NY": { lat: 40.9115, lng: -73.7824 },
  "Mount Vernon, NY": { lat: 40.9126, lng: -73.8371 },
  "Schenectady, NY": { lat: 42.8142, lng: -73.9396 },
  "Utica, NY": { lat: 43.1009, lng: -75.2327 },
  "White Plains, NY": { lat: 41.0330, lng: -73.7629 },
  "Troy, NY": { lat: 42.7284, lng: -73.6918 },
  "Niagara Falls, NY": { lat: 43.0962, lng: -79.0377 },
  "Binghamton, NY": { lat: 42.0987, lng: -75.9179 },
  "Rome, NY": { lat: 43.2128, lng: -75.4557 },
  "Long Beach, NY": { lat: 40.5884, lng: -73.6579 },
  "Poughkeepsie, NY": { lat: 41.7004, lng: -73.9210 },
  "North Tonawanda, NY": { lat: 43.0387, lng: -78.8642 },
  "Jamestown, NY": { lat: 42.0970, lng: -79.2353 },
  "Ithaca, NY": { lat: 42.4430, lng: -76.5019 },
  "Elmira, NY": { lat: 42.0898, lng: -76.8077 },
  "Newburgh, NY": { lat: 41.5034, lng: -74.0104 },
  "Middletown, NY": { lat: 41.4459, lng: -74.4229 },
  "Auburn, NY": { lat: 42.9317, lng: -76.5661 },
  "Watertown, NY": { lat: 43.9748, lng: -75.9108 },
  "Glen Cove, NY": { lat: 40.8623, lng: -73.6337 },
  "Saratoga Springs, NY": { lat: 43.0831, lng: -73.7846 },
  "Kingston, NY": { lat: 41.9270, lng: -73.9974 },
  "Peekskill, NY": { lat: 41.2901, lng: -73.9204 },
  "Lockport, NY": { lat: 43.1706, lng: -78.6903 },
  "Plattsburgh, NY": { lat: 44.6995, lng: -73.4529 },
};

export const sampleJobs: Job[] = [
  {
    id: "1",
    title: "Senior Software Engineer",
    company: "TechCorp",
    location: "New York, NY",
    salary: "$120,000 - $150,000",
    description: "We're looking for a talented software engineer to join our growing team. You'll work on cutting-edge projects and help shape the future of our platform.",
    requirements: [
      "5+ years of experience in software development",
      "Strong knowledge of React, TypeScript, and Node.js",
      "Experience with cloud platforms (AWS, GCP, or Azure)",
      "Excellent problem-solving skills",
      "Strong communication and teamwork abilities"
    ],
    benefits: [
      "Competitive salary and equity package",
      "Flexible work hours and remote work options",
      "Comprehensive health, dental, and vision insurance",
      "401(k) matching program",
      "Professional development budget",
      "Unlimited PTO"
    ],
    tags: ["React", "TypeScript", "Node.js", "Full Stack"],
    fitScore: 85,
    connections: [
      "John Smith - Senior Engineer at TechCorp",
      "Sarah Johnson - Product Manager at TechCorp",
      "Mike Davis - Engineering Manager at TechCorp"
    ],
    appliedDate: new Date(),
    lat: NY_CITY_COORDS["New York, NY"].lat,
    lng: NY_CITY_COORDS["New York, NY"].lng,
    additionalQuestions: [
      { id: "1", question: "What's your experience with microservices architecture?", type: "text" as const },
      { id: "2", question: "How do you handle technical disagreements with team members?", type: "text" as const }
    ]
  },
  {
    id: "2",
    title: "Frontend Developer",
    company: "DesignStudio",
    location: "Buffalo, NY",
    salary: "$90,000 - $110,000",
    description: "Join our creative team to build beautiful, user-friendly web applications. We focus on creating exceptional user experiences.",
    requirements: [
      "3+ years of frontend development experience",
      "Proficiency in HTML, CSS, and JavaScript",
      "Experience with modern frameworks (React, Vue, or Angular)",
      "Understanding of responsive design principles",
      "Knowledge of web accessibility standards"
    ],
    benefits: [
      "Competitive salary",
      "Health and dental insurance",
      "Flexible work schedule",
      "Creative and collaborative environment",
      "Professional development opportunities"
    ],
    tags: ["Frontend", "React", "CSS", "UI/UX"],
    fitScore: 78,
    connections: [
      "Alex Chen - Frontend Lead at DesignStudio",
      "Emma Wilson - UX Designer at DesignStudio"
    ],
    appliedDate: new Date(),
    lat: NY_CITY_COORDS["Buffalo, NY"].lat,
    lng: NY_CITY_COORDS["Buffalo, NY"].lng
  },
  {
    id: "3",
    title: "DevOps Engineer",
    company: "CloudTech",
    location: "Rochester, NY",
    salary: "$100,000 - $130,000",
    description: "Help us build and maintain robust infrastructure that scales. You'll work with cutting-edge cloud technologies and automation tools.",
    requirements: [
      "4+ years of DevOps or infrastructure experience",
      "Strong knowledge of AWS, Docker, and Kubernetes",
      "Experience with CI/CD pipelines",
      "Knowledge of monitoring and logging tools",
      "Scripting skills (Python, Bash, or similar)"
    ],
    benefits: [
      "Competitive salary and benefits",
      "Remote work options",
      "Latest tools and technologies",
      "Professional development budget",
      "Health and wellness programs"
    ],
    tags: ["DevOps", "AWS", "Docker", "Kubernetes"],
    fitScore: 72,
    connections: [
      "David Brown - DevOps Lead at CloudTech",
      "Lisa Garcia - Infrastructure Engineer at CloudTech"
    ],
    appliedDate: new Date(),
    lat: NY_CITY_COORDS["Rochester, NY"].lat,
    lng: NY_CITY_COORDS["Rochester, NY"].lng
  },
  {
    id: "4",
    title: "Product Manager",
    company: "InnovateLabs",
    location: "Yonkers, NY",
    salary: "$110,000 - $140,000",
    description: "Lead product strategy and development for our next-generation platform. Work closely with engineering, design, and business teams.",
    requirements: [
      "5+ years of product management experience",
      "Strong analytical and strategic thinking",
      "Experience with agile methodologies",
      "Excellent communication and leadership skills",
      "Technical background preferred"
    ],
    benefits: [
      "Competitive salary and equity",
      "Comprehensive benefits package",
      "Flexible work arrangements",
      "Professional development opportunities",
      "Collaborative team environment"
    ],
    tags: ["Product Management", "Strategy", "Agile", "Leadership"],
    fitScore: 68,
    connections: [
      "Rachel Green - Senior PM at InnovateLabs",
      "Tom Anderson - Engineering Director at InnovateLabs"
    ],
    appliedDate: new Date(),
    lat: NY_CITY_COORDS["Yonkers, NY"].lat,
    lng: NY_CITY_COORDS["Yonkers, NY"].lng
  },
  {
    id: "5",
    title: "Data Scientist",
    company: "AnalyticsPro",
    location: "Syracuse, NY",
    salary: "$95,000 - $125,000",
    description: "Join our data science team to build machine learning models and drive insights from large datasets.",
    requirements: [
      "3+ years of data science experience",
      "Strong Python and SQL skills",
      "Experience with ML frameworks (TensorFlow, PyTorch)",
      "Statistical analysis and modeling skills",
      "Experience with big data technologies"
    ],
    benefits: [
      "Competitive salary and benefits",
      "Cutting-edge technology stack",
      "Research and development opportunities",
      "Health and wellness benefits",
      "Professional growth support"
    ],
    tags: ["Data Science", "Machine Learning", "Python", "Statistics"],
    fitScore: 75,
    connections: [
      "Dr. Maria Rodriguez - Lead Data Scientist at AnalyticsPro",
      "James Wilson - ML Engineer at AnalyticsPro"
    ],
    appliedDate: new Date(),
    lat: NY_CITY_COORDS["Syracuse, NY"].lat,
    lng: NY_CITY_COORDS["Syracuse, NY"].lng
  },
  {
    id: "6",
    title: "Marketing Specialist",
    company: "BrandMakers",
    location: "Albany, NY",
    salary: "$60,000 - $80,000",
    description: "Drive marketing campaigns and brand awareness for our clients.",
    requirements: ["2+ years in marketing", "Experience with digital campaigns", "Strong communication skills"],
    benefits: ["Health insurance", "Remote work options", "Performance bonuses"],
    tags: ["Marketing", "Digital", "Brand"],
    fitScore: 70,
    connections: ["Samantha Lee - Marketing Lead"],
    appliedDate: new Date(),
    lat: NY_CITY_COORDS["Albany, NY"].lat,
    lng: NY_CITY_COORDS["Albany, NY"].lng
  },
  {
    id: "7",
    title: "UI/UX Designer",
    company: "PixelPerfect",
    location: "New Rochelle, NY",
    salary: "$80,000 - $100,000",
    description: "Design intuitive interfaces for web and mobile apps.",
    requirements: ["3+ years in UI/UX", "Portfolio of design work", "Figma/Sketch experience"],
    benefits: ["Flexible hours", "Creative environment"],
    tags: ["UI/UX", "Design", "Figma"],
    fitScore: 77,
    connections: ["Chris Kim - Design Director"],
    appliedDate: new Date(),
    lat: NY_CITY_COORDS["New Rochelle, NY"].lat,
    lng: NY_CITY_COORDS["New Rochelle, NY"].lng
  },
  {
    id: "8",
    title: "Sales Associate",
    company: "RetailPro",
    location: "Mount Vernon, NY",
    salary: "$40,000 - $55,000",
    description: "Engage with customers and drive sales in our retail stores.",
    requirements: ["Retail experience", "Strong interpersonal skills"],
    benefits: ["Commission", "Employee discounts"],
    tags: ["Sales", "Retail"],
    fitScore: 65,
    connections: ["Jordan Smith - Store Manager"],
    appliedDate: new Date(),
    lat: NY_CITY_COORDS["Mount Vernon, NY"].lat,
    lng: NY_CITY_COORDS["Mount Vernon, NY"].lng
  },
  {
    id: "9",
    title: "Network Engineer",
    company: "NetSecure",
    location: "Schenectady, NY",
    salary: "$90,000 - $120,000",
    description: "Maintain and secure our growing network infrastructure.",
    requirements: ["Cisco certification", "Firewall experience"],
    benefits: ["401(k)", "Remote work"],
    tags: ["Network", "Security"],
    fitScore: 73,
    connections: ["Patricia Brown - IT Director"],
    appliedDate: new Date(),
    lat: NY_CITY_COORDS["Schenectady, NY"].lat,
    lng: NY_CITY_COORDS["Schenectady, NY"].lng
  },
  {
    id: "10",
    title: "Operations Manager",
    company: "LogistiCo",
    location: "Utica, NY",
    salary: "$85,000 - $110,000",
    description: "Oversee daily operations and logistics for our NY branch.",
    requirements: ["Management experience", "Logistics background"],
    benefits: ["Company car", "Bonus structure"],
    tags: ["Operations", "Logistics"],
    fitScore: 74,
    connections: ["Derek White - COO"],
    appliedDate: new Date(),
    lat: NY_CITY_COORDS["Utica, NY"].lat,
    lng: NY_CITY_COORDS["Utica, NY"].lng
  },
  {
    id: "11",
    title: "Content Writer",
    company: "WriteRight",
    location: "White Plains, NY",
    salary: "$50,000 - $70,000",
    description: "Create engaging content for our clients' websites and blogs.",
    requirements: ["Writing samples", "SEO knowledge"],
    benefits: ["Remote work", "Flexible schedule"],
    tags: ["Content", "Writing", "SEO"],
    fitScore: 69,
    connections: ["Emily Green - Content Lead"],
    appliedDate: new Date(),
    lat: NY_CITY_COORDS["White Plains, NY"].lat,
    lng: NY_CITY_COORDS["White Plains, NY"].lng
  },
  {
    id: "12",
    title: "HR Coordinator",
    company: "PeopleFirst",
    location: "Troy, NY",
    salary: "$55,000 - $75,000",
    description: "Support HR functions and employee relations.",
    requirements: ["HR experience", "Organizational skills"],
    benefits: ["Health insurance", "Paid time off"],
    tags: ["HR", "Coordinator"],
    fitScore: 68,
    connections: ["Linda Black - HR Manager"],
    appliedDate: new Date(),
    lat: NY_CITY_COORDS["Troy, NY"].lat,
    lng: NY_CITY_COORDS["Troy, NY"].lng
  },
  {
    id: "13",
    title: "Business Analyst",
    company: "BizInsights",
    location: "Niagara Falls, NY",
    salary: "$75,000 - $95,000",
    description: "Analyze business processes and recommend improvements.",
    requirements: ["Analytical skills", "Excel proficiency"],
    benefits: ["401(k)", "Health insurance"],
    tags: ["Business", "Analysis"],
    fitScore: 71,
    connections: ["Kevin Brown - Lead Analyst"],
    appliedDate: new Date(),
    lat: NY_CITY_COORDS["Niagara Falls, NY"].lat,
    lng: NY_CITY_COORDS["Niagara Falls, NY"].lng
  },
  {
    id: "14",
    title: "Customer Support Rep",
    company: "HelpDeskNY",
    location: "Binghamton, NY",
    salary: "$38,000 - $50,000",
    description: "Assist customers with product issues and questions.",
    requirements: ["Customer service experience"],
    benefits: ["Remote work", "Health insurance"],
    tags: ["Support", "Customer"],
    fitScore: 66,
    connections: ["Rachel Adams - Support Lead"],
    appliedDate: new Date(),
    lat: NY_CITY_COORDS["Binghamton, NY"].lat,
    lng: NY_CITY_COORDS["Binghamton, NY"].lng
  },
  {
    id: "15",
    title: "QA Tester",
    company: "QualityFirst",
    location: "Rome, NY",
    salary: "$60,000 - $80,000",
    description: "Test software releases and report bugs.",
    requirements: ["QA experience", "Attention to detail"],
    benefits: ["Flexible hours", "Remote work"],
    tags: ["QA", "Testing"],
    fitScore: 67,
    connections: ["Brian Lee - QA Manager"],
    appliedDate: new Date(),
    lat: NY_CITY_COORDS["Rome, NY"].lat,
    lng: NY_CITY_COORDS["Rome, NY"].lng
  },
  {
    id: "16",
    title: "Project Coordinator",
    company: "BuildItNY",
    location: "Long Beach, NY",
    salary: "$65,000 - $85,000",
    description: "Coordinate project tasks and timelines.",
    requirements: ["Project management experience"],
    benefits: ["Health insurance", "401(k)"],
    tags: ["Project", "Coordinator"],
    fitScore: 72,
    connections: ["Megan Fox - Project Lead"],
    appliedDate: new Date(),
    lat: NY_CITY_COORDS["Long Beach, NY"].lat,
    lng: NY_CITY_COORDS["Long Beach, NY"].lng
  },
  {
    id: "17",
    title: "Financial Advisor",
    company: "MoneyMatters",
    location: "Poughkeepsie, NY",
    salary: "$80,000 - $110,000",
    description: "Advise clients on financial planning and investments.",
    requirements: ["Finance degree", "Series 7 license"],
    benefits: ["Commission", "401(k)"],
    tags: ["Finance", "Advisor"],
    fitScore: 76,
    connections: ["Steven Clark - Senior Advisor"],
    appliedDate: new Date(),
    lat: NY_CITY_COORDS["Poughkeepsie, NY"].lat,
    lng: NY_CITY_COORDS["Poughkeepsie, NY"].lng
  },
  {
    id: "18",
    title: "Graphic Designer",
    company: "ArtistryNY",
    location: "North Tonawanda, NY",
    salary: "$55,000 - $75,000",
    description: "Create graphics for print and digital media.",
    requirements: ["Design portfolio", "Adobe Suite proficiency"],
    benefits: ["Creative environment", "Remote work"],
    tags: ["Graphic", "Design"],
    fitScore: 70,
    connections: ["Olivia White - Art Director"],
    appliedDate: new Date(),
    lat: NY_CITY_COORDS["North Tonawanda, NY"].lat,
    lng: NY_CITY_COORDS["North Tonawanda, NY"].lng
  },
  {
    id: "19",
    title: "Software Tester",
    company: "TestLabNY",
    location: "Jamestown, NY",
    salary: "$58,000 - $78,000",
    description: "Test and validate software products.",
    requirements: ["Testing experience", "Bug tracking tools"],
    benefits: ["Remote work", "Flexible schedule"],
    tags: ["Testing", "QA"],
    fitScore: 68,
    connections: ["Paul Black - Test Lead"],
    appliedDate: new Date(),
    lat: NY_CITY_COORDS["Jamestown, NY"].lat,
    lng: NY_CITY_COORDS["Jamestown, NY"].lng
  },
  {
    id: "20",
    title: "Research Assistant",
    company: "Ithaca Research",
    location: "Ithaca, NY",
    salary: "$45,000 - $60,000",
    description: "Assist in academic and market research projects.",
    requirements: ["Research experience", "Data analysis"],
    benefits: ["University benefits", "Flexible hours"],
    tags: ["Research", "Assistant"],
    fitScore: 73,
    connections: ["Dr. Henry Gold - Research Lead"],
    appliedDate: new Date(),
    lat: NY_CITY_COORDS["Ithaca, NY"].lat,
    lng: NY_CITY_COORDS["Ithaca, NY"].lng
  },
  {
    id: "21",
    title: "Medical Receptionist",
    company: "HealthFirst",
    location: "Elmira, NY",
    salary: "$32,000 - $42,000",
    description: "Greet patients and manage appointments.",
    requirements: ["Reception experience", "Organizational skills"],
    benefits: ["Health insurance", "Paid time off"],
    tags: ["Medical", "Reception"],
    fitScore: 65,
    connections: ["Jessica Blue - Office Manager"],
    appliedDate: new Date(),
    lat: NY_CITY_COORDS["Elmira, NY"].lat,
    lng: NY_CITY_COORDS["Elmira, NY"].lng
  },
  {
    id: "22",
    title: "Warehouse Associate",
    company: "StoragePro",
    location: "Newburgh, NY",
    salary: "$35,000 - $45,000",
    description: "Assist with warehouse operations and inventory.",
    requirements: ["Warehouse experience", "Forklift certification"],
    benefits: ["401(k)", "Health insurance"],
    tags: ["Warehouse", "Inventory"],
    fitScore: 66,
    connections: ["Tom Green - Warehouse Lead"],
    appliedDate: new Date(),
    lat: NY_CITY_COORDS["Newburgh, NY"].lat,
    lng: NY_CITY_COORDS["Newburgh, NY"].lng
  },
  {
    id: "23",
    title: "Paralegal",
    company: "LawNY",
    location: "Middletown, NY",
    salary: "$50,000 - $65,000",
    description: "Support attorneys with legal research and documentation.",
    requirements: ["Paralegal certificate", "Legal research"],
    benefits: ["Health insurance", "401(k)"],
    tags: ["Paralegal", "Legal"],
    fitScore: 69,
    connections: ["Anna White - Senior Paralegal"],
    appliedDate: new Date(),
    lat: NY_CITY_COORDS["Middletown, NY"].lat,
    lng: NY_CITY_COORDS["Middletown, NY"].lng
  },
  {
    id: "24",
    title: "Chef",
    company: "TasteNY",
    location: "Auburn, NY",
    salary: "$48,000 - $65,000",
    description: "Prepare meals and manage kitchen staff.",
    requirements: ["Culinary degree", "Kitchen management"],
    benefits: ["Meals provided", "Health insurance"],
    tags: ["Chef", "Culinary"],
    fitScore: 72,
    connections: ["Marco Rossi - Head Chef"],
    appliedDate: new Date(),
    lat: NY_CITY_COORDS["Auburn, NY"].lat,
    lng: NY_CITY_COORDS["Auburn, NY"].lng
  },
  {
    id: "25",
    title: "Civil Engineer",
    company: "BuildNY",
    location: "Watertown, NY",
    salary: "$85,000 - $105,000",
    description: "Design and oversee construction projects.",
    requirements: ["Engineering degree", "AutoCAD experience"],
    benefits: ["401(k)", "Health insurance"],
    tags: ["Civil", "Engineer"],
    fitScore: 75,
    connections: ["Lisa Brown - Engineering Lead"],
    appliedDate: new Date(),
    lat: NY_CITY_COORDS["Watertown, NY"].lat,
    lng: NY_CITY_COORDS["Watertown, NY"].lng
  },
  {
    id: "26",
    title: "Event Planner",
    company: "EventsNY",
    location: "Glen Cove, NY",
    salary: "$55,000 - $70,000",
    description: "Plan and coordinate events for clients.",
    requirements: ["Event planning experience", "Organizational skills"],
    benefits: ["Flexible schedule", "Remote work"],
    tags: ["Event", "Planner"],
    fitScore: 71,
    connections: ["Nina Black - Event Director"],
    appliedDate: new Date(),
    lat: NY_CITY_COORDS["Glen Cove, NY"].lat,
    lng: NY_CITY_COORDS["Glen Cove, NY"].lng
  },
  {
    id: "27",
    title: "Pharmacist",
    company: "PharmaNY",
    location: "Saratoga Springs, NY",
    salary: "$110,000 - $130,000",
    description: "Dispense medications and counsel patients.",
    requirements: ["Pharmacy degree", "NY license"],
    benefits: ["Health insurance", "401(k)"],
    tags: ["Pharmacist", "Pharmacy"],
    fitScore: 78,
    connections: ["Dr. Alan White - Pharmacy Lead"],
    appliedDate: new Date(),
    lat: NY_CITY_COORDS["Saratoga Springs, NY"].lat,
    lng: NY_CITY_COORDS["Saratoga Springs, NY"].lng
  },
  {
    id: "28",
    title: "Librarian",
    company: "LibraryNY",
    location: "Kingston, NY",
    salary: "$48,000 - $62,000",
    description: "Manage library resources and assist patrons.",
    requirements: ["Library science degree", "Customer service"],
    benefits: ["Pension", "Health insurance"],
    tags: ["Librarian", "Library"],
    fitScore: 70,
    connections: ["Mary Black - Library Director"],
    appliedDate: new Date(),
    lat: NY_CITY_COORDS["Kingston, NY"].lat,
    lng: NY_CITY_COORDS["Kingston, NY"].lng
  },
  {
    id: "29",
    title: "Social Worker",
    company: "CareNY",
    location: "Peekskill, NY",
    salary: "$52,000 - $68,000",
    description: "Support individuals and families in need.",
    requirements: ["Social work degree", "NY license"],
    benefits: ["Health insurance", "Pension"],
    tags: ["Social", "Worker"],
    fitScore: 74,
    connections: ["Sarah White - Social Work Lead"],
    appliedDate: new Date(),
    lat: NY_CITY_COORDS["Peekskill, NY"].lat,
    lng: NY_CITY_COORDS["Peekskill, NY"].lng
  },
  {
    id: "30",
    title: "Manufacturing Technician",
    company: "MakeItNY",
    location: "Lockport, NY",
    salary: "$42,000 - $58,000",
    description: "Operate and maintain manufacturing equipment.",
    requirements: ["Manufacturing experience", "Technical skills"],
    benefits: ["Health insurance", "401(k)"],
    tags: ["Manufacturing", "Technician"],
    fitScore: 68,
    connections: ["George Black - Plant Manager"],
    appliedDate: new Date(),
    lat: NY_CITY_COORDS["Lockport, NY"].lat,
    lng: NY_CITY_COORDS["Lockport, NY"].lng
  },
  {
    id: "31",
    title: "Environmental Scientist",
    company: "EcoNY",
    location: "Plattsburgh, NY",
    salary: "$70,000 - $90,000",
    description: "Conduct environmental research and fieldwork.",
    requirements: ["Science degree", "Fieldwork experience"],
    benefits: ["Research grants", "Health insurance"],
    tags: ["Environmental", "Science"],
    fitScore: 73,
    connections: ["Dr. Susan Green - Science Lead"],
    appliedDate: new Date(),
    lat: NY_CITY_COORDS["Plattsburgh, NY"].lat,
    lng: NY_CITY_COORDS["Plattsburgh, NY"].lng
  }
];

export const getRandomJob = (): ExtendedJob => {
  const randomIndex = Math.floor(Math.random() * sampleJobs.length);
  const job = sampleJobs[randomIndex];
  
  // Create a new job object with a unique ID and current date
  return {
    ...job,
    id: Date.now().toString(),
    appliedDate: new Date()
  };
};

export default sampleJobs; 