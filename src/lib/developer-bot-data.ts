/** Shared data for generating realistic test developer profiles (owner bot). */

export type BotDomainId =
  | 'ai-ml'
  | 'data-science'
  | 'web-dev'
  | 'mobile'
  | 'ar-vr'
  | 'cloud-devops'
  | 'cybersecurity'
  | 'blockchain'
  | 'game-dev'
  | 'ui-ux'
  | 'api-integrations'
  | 'ai-agents';

export interface BotDomain {
  id: BotDomainId;
  title: string;
  titles: string[];
  skills: string[];
  summaryTemplates: string[];
}

export const BOT_DOMAINS: BotDomain[] = [
  {
    id: 'ai-ml',
    title: 'AI & ML',
    titles: ['ML Engineer', 'AI Engineer', 'LLM Specialist'],
    skills: ['Python', 'PyTorch', 'TensorFlow', 'OpenAI', 'LangChain', 'Hugging Face', 'scikit-learn'],
    summaryTemplates: [
      'ML engineer shipping production models from research notebooks to reliable APIs.',
      'Specialist in LLMs, fine-tuning, and evaluation pipelines for real-world products.',
    ],
  },
  {
    id: 'data-science',
    title: 'Data Science',
    titles: ['Data Scientist', 'Analytics Engineer', 'Data Analyst'],
    skills: ['Python', 'Pandas', 'Spark', 'SQL', 'Tableau', 'dbt', 'Airflow'],
    summaryTemplates: [
      'Turns messy data into decisions with robust pipelines and clear stakeholder storytelling.',
      'Analytics engineer focused on reliable metrics, experimentation, and scalable data models.',
    ],
  },
  {
    id: 'web-dev',
    title: 'Web',
    titles: ['Full Stack Developer', 'Frontend Engineer', 'Backend Engineer'],
    skills: ['React', 'Next.js', 'TypeScript', 'Node.js', 'PostgreSQL', 'GraphQL', 'Tailwind CSS'],
    summaryTemplates: [
      'Full-stack engineer building fast, accessible web apps with clean architecture.',
      'Frontend-focused developer who cares about performance, DX, and polished UX.',
    ],
  },
  {
    id: 'mobile',
    title: 'Mobile',
    titles: ['Mobile Developer', 'iOS Engineer', 'React Native Developer'],
    skills: ['React Native', 'Flutter', 'Swift', 'Kotlin', 'Firebase', 'App Store', 'Google Play'],
    summaryTemplates: [
      'Mobile engineer shipping polished cross-platform apps with native performance where it matters.',
      'iOS and Android developer with a track record of apps used by thousands daily.',
    ],
  },
  {
    id: 'ar-vr',
    title: 'AR / VR',
    titles: ['XR Developer', 'Unity Developer', 'Immersive Experience Engineer'],
    skills: ['Unity', 'Unity XR', 'WebXR', 'Three.js', 'C#', 'Blender', 'OpenXR'],
    summaryTemplates: [
      'XR developer crafting immersive training and product experiences in Unity and WebXR.',
    ],
  },
  {
    id: 'cloud-devops',
    title: 'Cloud & DevOps',
    titles: ['DevOps Engineer', 'Cloud Architect', 'Platform Engineer'],
    skills: ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'CI/CD', 'Linux', 'Prometheus'],
    summaryTemplates: [
      'Platform engineer automating infra, observability, and zero-downtime deployments.',
      'Cloud architect designing resilient systems on AWS and Kubernetes.',
    ],
  },
  {
    id: 'cybersecurity',
    title: 'Security',
    titles: ['Security Engineer', 'Application Security Specialist', 'Penetration Tester'],
    skills: ['OWASP', 'Burp Suite', 'SOC 2', 'Threat Modeling', 'Python', 'SIEM', 'IAM'],
    summaryTemplates: [
      'Security engineer embedding secure-by-default practices across the SDLC.',
    ],
  },
  {
    id: 'blockchain',
    title: 'Web3',
    titles: ['Blockchain Developer', 'Smart Contract Engineer', 'Web3 Full Stack Developer'],
    skills: ['Solidity', 'Ethereum', 'Hardhat', 'Web3.js', 'Rust', 'IPFS', 'DeFi'],
    summaryTemplates: [
      'Smart contract engineer building audited on-chain systems for production workloads.',
    ],
  },
  {
    id: 'game-dev',
    title: 'Games',
    titles: ['Game Developer', 'Unity Engineer', 'Gameplay Programmer'],
    skills: ['Unity', 'Unreal', 'C#', 'C++', 'Shader Graph', 'Multiplayer', 'Photon'],
    summaryTemplates: [
      'Gameplay programmer focused on feel, performance, and player-first multiplayer systems.',
    ],
  },
  {
    id: 'ui-ux',
    title: 'Design',
    titles: ['UI/UX Designer', 'Product Designer', 'Design Engineer'],
    skills: ['Figma', 'Framer', 'Design Systems', 'Prototyping', 'HTML', 'CSS', 'Accessibility'],
    summaryTemplates: [
      'Product designer bridging research, systems, and implementation for delightful interfaces.',
    ],
  },
  {
    id: 'api-integrations',
    title: 'QA Testing',
    titles: ['QA Engineer', 'Test Automation Engineer', 'SDET'],
    skills: ['Playwright', 'Cypress', 'Jest', 'Selenium', 'API Testing', 'Postman', 'CI/CD'],
    summaryTemplates: [
      'QA engineer building automation that catches regressions before users do.',
    ],
  },
  {
    id: 'ai-agents',
    title: 'AI Data Labeling',
    titles: ['Data Labeling Lead', 'Annotation Specialist', 'ML Data Ops Engineer'],
    skills: ['CVAT', 'Label Studio', 'Python', 'Quality Assurance', 'Computer Vision', 'NLP'],
    summaryTemplates: [
      'Data ops specialist running high-quality annotation pipelines for vision and NLP models.',
    ],
  },
];

export const BOT_DOMAIN_IDS = BOT_DOMAINS.map((d) => d.id);

export const FIRST_NAMES = [
  'Alex', 'Jordan', 'Sam', 'Taylor', 'Morgan', 'Riley', 'Casey', 'Avery',
  'Priya', 'Arjun', 'Mei', 'Yuki', 'Luca', 'Sofia', 'Omar', 'Ingrid',
  'Marcus', 'Elena', 'Noah', 'Zara', 'Viktor', 'Amara', 'Chen', 'Fatima',
  'Diego', 'Hannah', 'Kwame', 'Leila', 'Ivan', 'Nina', 'Raj', 'Emma',
];

export const LAST_NAMES = [
  'Chen', 'Johnson', 'Patel', 'Garcia', 'Kim', 'Nguyen', 'Schmidt', 'Ali',
  'Brown', 'Wilson', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Jackson',
  'White', 'Harris', 'Clark', 'Lewis', 'Walker', 'Hall', 'Young', 'King',
  'Wright', 'Lopez', 'Hill', 'Scott', 'Green', 'Adams', 'Baker', 'Rivera',
];

export const COMPANIES = [
  'Stripe', 'Shopify', 'Spotify', 'Notion', 'Figma', 'GitHub', 'Atlassian',
  'Datadog', 'Cloudflare', 'Revolut', 'Wise', 'Klarna', 'Zalando', 'Booking.com',
  'Delivery Hero', 'Mercado Libre', 'Grab', 'Rakuten', 'LINE', 'Canva',
];

export const UNIVERSITIES = [
  'MIT', 'Stanford University', 'UC Berkeley', 'Carnegie Mellon', 'ETH Zurich',
  'Imperial College London', 'TU Munich', 'University of Toronto', 'NUS Singapore',
  'IIT Bombay', 'Seoul National University', 'University of São Paulo',
];

/** City hints keyed by country name (subset of high-traffic countries) */
export const COUNTRY_CITIES: Record<string, string[]> = {
  'United States': ['San Francisco, CA', 'New York, NY', 'Austin, TX', 'Seattle, WA'],
  'United Kingdom': ['London', 'Manchester', 'Edinburgh', 'Bristol'],
  'Germany': ['Berlin', 'Munich', 'Hamburg', 'Frankfurt'],
  'France': ['Paris', 'Lyon', 'Marseille', 'Toulouse'],
  'Canada': ['Toronto, ON', 'Vancouver, BC', 'Montreal, QC', 'Calgary, AB'],
  'India': ['Bangalore', 'Mumbai', 'Hyderabad', 'Pune'],
  'Brazil': ['São Paulo', 'Rio de Janeiro', 'Curitiba', 'Belo Horizonte'],
  'Australia': ['Sydney', 'Melbourne', 'Brisbane', 'Perth'],
  'Japan': ['Tokyo', 'Osaka', 'Kyoto', 'Fukuoka'],
  'Singapore': ['Singapore'],
  'Netherlands': ['Amsterdam', 'Rotterdam', 'Utrecht', 'Eindhoven'],
  'Spain': ['Madrid', 'Barcelona', 'Valencia', 'Seville'],
  'Poland': ['Warsaw', 'Kraków', 'Wrocław', 'Gdańsk'],
  'Ukraine': ['Kyiv', 'Lviv', 'Odesa', 'Kharkiv'],
  'Nigeria': ['Lagos', 'Abuja', 'Port Harcourt'],
  'Kenya': ['Nairobi', 'Mombasa'],
  'Mexico': ['Mexico City', 'Guadalajara', 'Monterrey'],
  'Colombia': ['Bogotá', 'Medellín', 'Cali', 'Barranquilla'],
  'Chile': ['Santiago', 'Valparaíso', 'Concepción', 'Antofagasta'],
  'Uzbekistan': ['Tashkent', 'Samarkand', 'Bukhara', 'Namangan'],
  'Argentina': ['Buenos Aires', 'Córdoba', 'Rosario'],
  'South Africa': ['Cape Town', 'Johannesburg', 'Durban'],
  'Philippines': ['Manila', 'Cebu City', 'Davao City'],
  'Vietnam': ['Ho Chi Minh City', 'Hanoi', 'Da Nang'],
  'Indonesia': ['Jakarta', 'Bandung', 'Surabaya'],
  'Turkey': ['Istanbul', 'Ankara', 'Izmir'],
  'Israel': ['Tel Aviv', 'Jerusalem', 'Haifa'],
  'Sweden': ['Stockholm', 'Gothenburg', 'Malmö'],
  'Switzerland': ['Zurich', 'Geneva', 'Basel'],
  'Italy': ['Rome', 'Milan', 'Turin', 'Naples'],
  'Ireland': ['Dublin', 'Cork', 'Galway', 'Limerick'],
  'Egypt': ['Cairo', 'Alexandria', 'Giza'],
  'South Korea': ['Seoul', 'Busan', 'Incheon', 'Daegu'],
  'China': ['Shanghai', 'Beijing', 'Shenzhen', 'Hangzhou'],
  'Portugal': ['Lisbon', 'Porto', 'Braga'],
  'Romania': ['Bucharest', 'Cluj-Napoca', 'Timișoara'],
  'Czech Republic': ['Prague', 'Brno', 'Ostrava'],
  'Austria': ['Vienna', 'Graz', 'Salzburg'],
  'Belgium': ['Brussels', 'Antwerp', 'Ghent'],
  'Norway': ['Oslo', 'Bergen', 'Trondheim'],
  'Denmark': ['Copenhagen', 'Aarhus', 'Odense'],
  'Finland': ['Helsinki', 'Espoo', 'Tampere'],
  'Greece': ['Athens', 'Thessaloniki', 'Patras'],
  'Hungary': ['Budapest', 'Debrecen', 'Szeged'],
  'Morocco': ['Casablanca', 'Rabat', 'Marrakesh'],
  'Pakistan': ['Karachi', 'Lahore', 'Islamabad'],
  'Bangladesh': ['Dhaka', 'Chittagong', 'Sylhet'],
  'Thailand': ['Bangkok', 'Chiang Mai', 'Phuket'],
  'Malaysia': ['Kuala Lumpur', 'Penang', 'Johor Bahru'],
  'New Zealand': ['Auckland', 'Wellington', 'Christchurch'],
  'Russia': ['Moscow', 'Saint Petersburg', 'Novosibirsk'],
  'Iran': ['Tehran', 'Isfahan', 'Shiraz'],
  'Saudi Arabia': ['Riyadh', 'Jeddah', 'Dammam'],
  'United Arab Emirates': ['Dubai', 'Abu Dhabi', 'Sharjah'],
};

export const LANGUAGE_POOL = [
  'English', 'Spanish', 'French', 'German', 'Portuguese', 'Mandarin',
  'Hindi', 'Arabic', 'Japanese', 'Korean', 'Italian', 'Dutch', 'Polish', 'Turkish',
];

/** RandomUser.me nationality codes (https://randomuser.me/documentation) */
export const COUNTRY_NAT_MAP: Record<string, string> = {
  Australia: 'au',
  Brazil: 'br',
  Canada: 'ca',
  Switzerland: 'ch',
  Germany: 'de',
  Denmark: 'dk',
  Spain: 'es',
  Finland: 'fi',
  France: 'fr',
  'United Kingdom': 'gb',
  Ireland: 'ie',
  India: 'in',
  Iran: 'ir',
  Mexico: 'mx',
  Netherlands: 'nl',
  Norway: 'no',
  'New Zealand': 'nz',
  Serbia: 'rs',
  Turkey: 'tr',
  Ukraine: 'ua',
  'United States': 'us',
};

/** Culturally appropriate names when RandomUser nat is unavailable */
export const COUNTRY_NAME_POOLS: Record<string, { first: { male: string[]; female: string[] }; last: string[] }> = {
  Japan: {
    first: {
      male: ['Haruto', 'Yuki', 'Ren', 'Sota', 'Kaito', 'Daiki', 'Shota', 'Takumi'],
      female: ['Yui', 'Hina', 'Sakura', 'Aoi', 'Mei', 'Rin', 'Mio', 'Akari'],
    },
    last: ['Tanaka', 'Suzuki', 'Sato', 'Takahashi', 'Watanabe', 'Ito', 'Yamamoto', 'Kobayashi'],
  },
  China: {
    first: {
      male: ['Wei', 'Jun', 'Hao', 'Ming', 'Lei', 'Chen', 'Feng', 'Bo'],
      female: ['Li', 'Mei', 'Xiu', 'Ying', 'Lan', 'Jing', 'Na', 'Fang'],
    },
    last: ['Wang', 'Li', 'Zhang', 'Liu', 'Chen', 'Yang', 'Huang', 'Zhao'],
  },
  'South Korea': {
    first: {
      male: ['Min-jun', 'Seo-jun', 'Do-yun', 'Ji-ho', 'Hyun-woo', 'Jin-woo'],
      female: ['Seo-yeon', 'Ji-woo', 'Ha-yoon', 'Min-seo', 'Su-bin', 'Yuna'],
    },
    last: ['Kim', 'Lee', 'Park', 'Choi', 'Jung', 'Kang', 'Cho', 'Yoon'],
  },
  Nigeria: {
    first: {
      male: ['Chidi', 'Emeka', 'Tunde', 'Olu', 'Ibrahim', 'Kelechi', 'Femi', 'Yusuf'],
      female: ['Amara', 'Ngozi', 'Fatima', 'Aisha', 'Chioma', 'Zainab', 'Adaeze', 'Halima'],
    },
    last: ['Okafor', 'Adeyemi', 'Bello', 'Okonkwo', 'Ibrahim', 'Eze', 'Mohammed', 'Nwosu'],
  },
  Kenya: {
    first: {
      male: ['Brian', 'Kevin', 'Samuel', 'Daniel', 'James', 'Peter', 'Joseph', 'David'],
      female: ['Grace', 'Faith', 'Mercy', 'Jane', 'Mary', 'Anne', 'Lucy', 'Wanjiku'],
    },
    last: ['Ochieng', 'Mutua', 'Kamau', 'Wanjala', 'Odhiambo', 'Kipchoge', 'Mwangi', 'Njoroge'],
  },
  Ghana: {
    first: {
      male: ['Kwame', 'Kofi', 'Yaw', 'Kwesi', 'Emmanuel', 'Samuel', 'Daniel', 'Prince'],
      female: ['Ama', 'Akua', 'Abena', 'Efua', 'Grace', 'Patricia', 'Elizabeth', 'Ruth'],
    },
    last: ['Mensah', 'Owusu', 'Boateng', 'Asante', 'Osei', 'Appiah', 'Darko', 'Amoah'],
  },
  Philippines: {
    first: {
      male: ['Jose', 'Juan', 'Mark', 'Angelo', 'Gabriel', 'Rafael', 'Miguel', 'Carlo'],
      female: ['Maria', 'Ana', 'Grace', 'Angelica', 'Joy', 'Patricia', 'Michelle', 'Camille'],
    },
    last: ['Santos', 'Reyes', 'Cruz', 'Bautista', 'Garcia', 'Mendoza', 'Torres', 'Flores'],
  },
  Vietnam: {
    first: {
      male: ['Minh', 'Anh', 'Huy', 'Duc', 'Khoa', 'Tuan', 'Long', 'Phuc'],
      female: ['Linh', 'Huong', 'Trang', 'Ngoc', 'Mai', 'Thao', 'Lan', 'Chi'],
    },
    last: ['Nguyen', 'Tran', 'Le', 'Pham', 'Hoang', 'Vo', 'Dang', 'Bui'],
  },
  Indonesia: {
    first: {
      male: ['Budi', 'Agus', 'Rizky', 'Aditya', 'Dimas', 'Fajar', 'Hendra', 'Bayu'],
      female: ['Siti', 'Dewi', 'Putri', 'Ayu', 'Rina', 'Fitri', 'Indah', 'Mega'],
    },
    last: ['Santoso', 'Wijaya', 'Kusuma', 'Pratama', 'Saputra', 'Nugroho', 'Setiawan', 'Hidayat'],
  },
  Poland: {
    first: {
      male: ['Jakub', 'Kamil', 'Piotr', 'Michal', 'Tomasz', 'Mateusz', 'Krzysztof', 'Adam'],
      female: ['Anna', 'Katarzyna', 'Magdalena', 'Agnieszka', 'Joanna', 'Monika', 'Natalia', 'Aleksandra'],
    },
    last: ['Kowalski', 'Nowak', 'Wojcik', 'Kaminski', 'Lewandowski', 'Zielinski', 'Szymanski', 'Wozniak'],
  },
  Israel: {
    first: {
      male: ['David', 'Noam', 'Ariel', 'Eitan', 'Yosef', 'Itai', 'Omri', 'Tal'],
      female: ['Noa', 'Maya', 'Yael', 'Shira', 'Tamar', 'Adi', 'Hila', 'Roni'],
    },
    last: ['Cohen', 'Levi', 'Mizrahi', 'Peretz', 'Biton', 'Avraham', 'Friedman', 'Katz'],
  },
  Sweden: {
    first: {
      male: ['Erik', 'Lars', 'Karl', 'Anders', 'Johan', 'Magnus', 'Oscar', 'Filip'],
      female: ['Anna', 'Eva', 'Maria', 'Karin', 'Sara', 'Emma', 'Linnea', 'Astrid'],
    },
    last: ['Andersson', 'Johansson', 'Karlsson', 'Nilsson', 'Eriksson', 'Larsson', 'Olsson', 'Persson'],
  },
  'South Africa': {
    first: {
      male: ['Thabo', 'Sipho', 'Lungile', 'Sibusiso', 'Pieter', 'Johan', 'Michael', 'Daniel'],
      female: ['Nomvula', 'Thandi', 'Lerato', 'Zanele', 'Sarah', 'Emma', 'Lisa', 'Naledi'],
    },
    last: ['Nkosi', 'Dlamini', 'Mokoena', 'Van der Merwe', 'Botha', 'Pretorius', 'Khumalo', 'Mthembu'],
  },
  Argentina: {
    first: {
      male: ['Mateo', 'Santiago', 'Benjamin', 'Lucas', 'Nicolas', 'Facundo', 'Agustin', 'Tomas'],
      female: ['Sofia', 'Valentina', 'Camila', 'Lucia', 'Martina', 'Florencia', 'Agustina', 'Paula'],
    },
    last: ['Gonzalez', 'Rodriguez', 'Fernandez', 'Lopez', 'Martinez', 'Garcia', 'Perez', 'Sanchez'],
  },
  Colombia: {
    first: {
      male: ['Santiago', 'Sebastian', 'Mateo', 'Nicolas', 'Daniel', 'Alejandro', 'Andres', 'Camilo'],
      female: ['Valentina', 'Mariana', 'Isabella', 'Sofia', 'Camila', 'Laura', 'Daniela', 'Paula'],
    },
    last: ['Garcia', 'Rodriguez', 'Martinez', 'Lopez', 'Gomez', 'Hernandez', 'Diaz', 'Moreno'],
  },
  Chile: {
    first: {
      male: ['Benjamin', 'Agustin', 'Vicente', 'Maximiliano', 'Matias', 'Joaquin', 'Felipe', 'Ignacio'],
      female: ['Emilia', 'Isidora', 'Florencia', 'Antonia', 'Javiera', 'Catalina', 'Amanda', 'Sofia'],
    },
    last: ['Gonzalez', 'Muñoz', 'Rojas', 'Diaz', 'Perez', 'Soto', 'Contreras', 'Silva'],
  },
  Uzbekistan: {
    first: {
      male: ['Aziz', 'Jasur', 'Sardor', 'Bekzod', 'Timur', 'Rustam', 'Shohruh', 'Farruh'],
      female: ['Madina', 'Nilufar', 'Dilnoza', 'Aziza', 'Kamola', 'Sevara', 'Gulnoza', 'Mohira'],
    },
    last: ['Karimov', 'Rakhimov', 'Yusupov', 'Khasanov', 'Tursunov', 'Mirzaev', 'Nazarov', 'Umarov'],
  },
  Singapore: {
    first: {
      male: ['Wei Ming', 'Jun Wei', 'Raj', 'Arjun', 'Marcus', 'Ethan', 'Ryan', 'Daniel'],
      female: ['Mei Ling', 'Priya', 'Sarah', 'Emily', 'Nurul', 'Michelle', 'Jessica', 'Amanda'],
    },
    last: ['Tan', 'Lim', 'Lee', 'Ng', 'Wong', 'Goh', 'Kumar', 'Chen'],
  },
  Egypt: {
    first: {
      male: ['Omar', 'Ahmed', 'Mohamed', 'Youssef', 'Karim', 'Hassan', 'Ali', 'Mahmoud'],
      female: ['Fatima', 'Nour', 'Salma', 'Mariam', 'Yasmin', 'Dina', 'Hana', 'Layla'],
    },
    last: ['Hassan', 'Mohamed', 'Ali', 'Ibrahim', 'Mahmoud', 'Farouk', 'Saeed', 'Mostafa'],
  },
  Pakistan: {
    first: {
      male: ['Ahmed', 'Usman', 'Hassan', 'Ali', 'Bilal', 'Hamza', 'Imran', 'Faisal'],
      female: ['Ayesha', 'Fatima', 'Sana', 'Hira', 'Zainab', 'Maryam', 'Nadia', 'Sara'],
    },
    last: ['Khan', 'Ahmed', 'Ali', 'Malik', 'Hussain', 'Sheikh', 'Iqbal', 'Raza'],
  },
  Bangladesh: {
    first: {
      male: ['Rahim', 'Karim', 'Arif', 'Tanvir', 'Imran', 'Shafiq', 'Nabil', 'Farhan'],
      female: ['Ayesha', 'Nusrat', 'Tasnim', 'Farhana', 'Sabrina', 'Mim', 'Ishrat', 'Ruma'],
    },
    last: ['Rahman', 'Ahmed', 'Islam', 'Hossain', 'Khan', 'Chowdhury', 'Akter', 'Begum'],
  },
};

/** Re-export portrait pools from multi-provider module */
export {
  PORTRAIT_URL_POOL,
  REGION_PORTRAIT_POOLS,
} from './portrait-sources';

/** Country → portrait region for non-RandomUser countries */
export const COUNTRY_PORTRAIT_REGION: Record<string, string> = {
  Japan: 'east_asia',
  China: 'east_asia',
  'South Korea': 'east_asia',
  India: 'south_asia',
  Pakistan: 'south_asia',
  Bangladesh: 'south_asia',
  Nigeria: 'africa',
  Kenya: 'africa',
  Ghana: 'africa',
  Ethiopia: 'africa',
  'South Africa': 'africa',
  Philippines: 'southeast_asia',
  Vietnam: 'southeast_asia',
  Indonesia: 'southeast_asia',
  Thailand: 'southeast_asia',
  Malaysia: 'southeast_asia',
  Argentina: 'latin_america',
  Colombia: 'latin_america',
  Chile: 'latin_america',
  Poland: 'europe',
  Israel: 'middle_east',
  Sweden: 'europe',
  Egypt: 'middle_east',
  Singapore: 'southeast_asia',
  Uzbekistan: 'central_asia',
  Kazakhstan: 'central_asia',
};

/** Common consumer email providers for realistic test accounts */
export const TEST_EMAIL_PROVIDERS = [
  'gmail.com',
  'outlook.com',
  'yahoo.com',
  'hotmail.com',
  'icloud.com',
  'proton.me',
  'live.com',
  'fastmail.com',
  'gmx.com',
  'mail.com',
] as const;

function normalizeEmailNamePart(value: string): string {
  return (
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z]/g, '') || 'user'
  );
}

/** Build a plausible personal email for fictional test developers (varied providers & formats). */
export function generateRealisticTestEmail(fullName: string): string {
  const tokens = fullName.trim().split(/\s+/).filter(Boolean);
  const first = normalizeEmailNamePart(tokens[0] ?? 'dev');
  const last = normalizeEmailNamePart(tokens[tokens.length - 1] ?? 'user');
  const digits = String(Math.floor(10 + Math.random() * 990));
  const provider = TEST_EMAIL_PROVIDERS[Math.floor(Math.random() * TEST_EMAIL_PROVIDERS.length)];

  const localParts = [
    `${first}.${last}`,
    `${first}.${last}${digits}`,
    `${first}${last}`,
    `${first[0]}${last}`,
    `${first[0]}${last}${digits}`,
    `${first}_${last}`,
    `${last}.${first}`,
    `${first}${digits}`,
  ];

  const local = localParts[Math.floor(Math.random() * localParts.length)];
  return `${local}@${provider}`;
}

