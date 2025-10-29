const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const skillsData = [
  // Programming Languages
  {
    skill_name: 'JavaScript',
    category: 'programming',
    subcategory: 'frontend',
    aliases: ['JS', 'ECMAScript', 'Node.js'],
    related_skills: ['TypeScript', 'React', 'Vue', 'Angular', 'Node.js'],
    industry_usage: { 'web_development': 0.95, 'mobile_development': 0.7, 'data_science': 0.3 },
    experience_levels: ['junior', 'middle', 'senior', 'lead']
  },
  {
    skill_name: 'Python',
    category: 'programming',
    subcategory: 'backend',
    aliases: ['Python3', 'Py'],
    related_skills: ['Django', 'Flask', 'FastAPI', 'Pandas', 'NumPy', 'Machine Learning'],
    industry_usage: { 'web_development': 0.8, 'data_science': 0.95, 'ai_ml': 0.9, 'automation': 0.7 },
    experience_levels: ['junior', 'middle', 'senior', 'lead']
  },
  {
    skill_name: 'Java',
    category: 'programming',
    subcategory: 'backend',
    aliases: ['Java SE', 'Java EE'],
    related_skills: ['Spring', 'Spring Boot', 'Hibernate', 'Maven', 'Gradle'],
    industry_usage: { 'enterprise': 0.9, 'web_development': 0.7, 'mobile_development': 0.6 },
    experience_levels: ['junior', 'middle', 'senior', 'lead']
  },
  {
    skill_name: 'TypeScript',
    category: 'programming',
    subcategory: 'frontend',
    aliases: ['TS'],
    related_skills: ['JavaScript', 'React', 'Angular', 'Vue', 'Node.js'],
    industry_usage: { 'web_development': 0.8, 'mobile_development': 0.6 },
    experience_levels: ['middle', 'senior', 'lead']
  },
  {
    skill_name: 'C#',
    category: 'programming',
    subcategory: 'backend',
    aliases: ['CSharp', 'C#.NET'],
    related_skills: ['.NET', 'ASP.NET', 'Entity Framework', 'WPF', 'Xamarin'],
    industry_usage: { 'enterprise': 0.85, 'web_development': 0.7, 'mobile_development': 0.5 },
    experience_levels: ['junior', 'middle', 'senior', 'lead']
  },

  // Frontend Frameworks
  {
    skill_name: 'React',
    category: 'framework',
    subcategory: 'frontend',
    aliases: ['React.js', 'ReactJS'],
    related_skills: ['JavaScript', 'TypeScript', 'Redux', 'Next.js', 'JSX'],
    industry_usage: { 'web_development': 0.9, 'mobile_development': 0.6 },
    experience_levels: ['junior', 'middle', 'senior', 'lead']
  },
  {
    skill_name: 'Vue.js',
    category: 'framework',
    subcategory: 'frontend',
    aliases: ['Vue', 'VueJS'],
    related_skills: ['JavaScript', 'TypeScript', 'Vuex', 'Nuxt.js'],
    industry_usage: { 'web_development': 0.6, 'startup': 0.7 },
    experience_levels: ['junior', 'middle', 'senior', 'lead']
  },
  {
    skill_name: 'Angular',
    category: 'framework',
    subcategory: 'frontend',
    aliases: ['AngularJS', 'Angular 2+'],
    related_skills: ['TypeScript', 'RxJS', 'NgRx'],
    industry_usage: { 'enterprise': 0.8, 'web_development': 0.7 },
    experience_levels: ['middle', 'senior', 'lead']
  },

  // Backend Frameworks
  {
    skill_name: 'Node.js',
    category: 'framework',
    subcategory: 'backend',
    aliases: ['Node', 'NodeJS'],
    related_skills: ['JavaScript', 'Express', 'Nest.js', 'Socket.io'],
    industry_usage: { 'web_development': 0.8, 'api_development': 0.9 },
    experience_levels: ['junior', 'middle', 'senior', 'lead']
  },
  {
    skill_name: 'Django',
    category: 'framework',
    subcategory: 'backend',
    aliases: ['Django Framework'],
    related_skills: ['Python', 'PostgreSQL', 'MySQL', 'REST API'],
    industry_usage: { 'web_development': 0.7, 'startup': 0.8 },
    experience_levels: ['middle', 'senior', 'lead']
  },
  {
    skill_name: 'Spring Boot',
    category: 'framework',
    subcategory: 'backend',
    aliases: ['Spring', 'Spring Framework'],
    related_skills: ['Java', 'Maven', 'Gradle', 'Hibernate'],
    industry_usage: { 'enterprise': 0.9, 'web_development': 0.8 },
    experience_levels: ['middle', 'senior', 'lead']
  },

  // Databases
  {
    skill_name: 'PostgreSQL',
    category: 'database',
    subcategory: 'relational',
    aliases: ['Postgres', 'PostgresQL'],
    related_skills: ['SQL', 'MySQL', 'MongoDB', 'Redis'],
    industry_usage: { 'web_development': 0.8, 'data_science': 0.7, 'enterprise': 0.9 },
    experience_levels: ['junior', 'middle', 'senior', 'lead']
  },
  {
    skill_name: 'MongoDB',
    category: 'database',
    subcategory: 'nosql',
    aliases: ['Mongo'],
    related_skills: ['NoSQL', 'Mongoose', 'Redis', 'Elasticsearch'],
    industry_usage: { 'web_development': 0.7, 'startup': 0.8, 'data_science': 0.6 },
    experience_levels: ['junior', 'middle', 'senior', 'lead']
  },
  {
    skill_name: 'MySQL',
    category: 'database',
    subcategory: 'relational',
    aliases: ['MySQL Server'],
    related_skills: ['SQL', 'PostgreSQL', 'MariaDB'],
    industry_usage: { 'web_development': 0.8, 'enterprise': 0.7 },
    experience_levels: ['junior', 'middle', 'senior', 'lead']
  },

  // Cloud & DevOps
  {
    skill_name: 'AWS',
    category: 'cloud',
    subcategory: 'platform',
    aliases: ['Amazon Web Services', 'Amazon AWS'],
    related_skills: ['Docker', 'Kubernetes', 'Terraform', 'CI/CD'],
    industry_usage: { 'cloud': 0.9, 'enterprise': 0.8, 'startup': 0.7 },
    experience_levels: ['middle', 'senior', 'lead']
  },
  {
    skill_name: 'Docker',
    category: 'devops',
    subcategory: 'containerization',
    aliases: ['Docker Engine', 'Docker Compose'],
    related_skills: ['Kubernetes', 'AWS', 'CI/CD', 'Microservices'],
    industry_usage: { 'devops': 0.9, 'cloud': 0.8, 'enterprise': 0.7 },
    experience_levels: ['middle', 'senior', 'lead']
  },
  {
    skill_name: 'Kubernetes',
    category: 'devops',
    subcategory: 'orchestration',
    aliases: ['K8s', 'Kube'],
    related_skills: ['Docker', 'AWS', 'Microservices', 'Helm'],
    industry_usage: { 'devops': 0.8, 'cloud': 0.9, 'enterprise': 0.8 },
    experience_levels: ['senior', 'lead']
  },

  // Design & UI/UX
  {
    skill_name: 'Figma',
    category: 'design',
    subcategory: 'ui_ux',
    aliases: ['Figma Design'],
    related_skills: ['Adobe XD', 'Sketch', 'UI Design', 'UX Design'],
    industry_usage: { 'design': 0.9, 'web_development': 0.6, 'startup': 0.8 },
    experience_levels: ['junior', 'middle', 'senior', 'lead']
  },
  {
    skill_name: 'Adobe Photoshop',
    category: 'design',
    subcategory: 'graphics',
    aliases: ['Photoshop', 'PS'],
    related_skills: ['Adobe Illustrator', 'Adobe XD', 'Graphic Design'],
    industry_usage: { 'design': 0.9, 'marketing': 0.8 },
    experience_levels: ['junior', 'middle', 'senior', 'lead']
  },

  // Soft Skills
  {
    skill_name: 'Project Management',
    category: 'soft_skills',
    subcategory: 'leadership',
    aliases: ['PM', 'Project Leadership'],
    related_skills: ['Agile', 'Scrum', 'Team Leadership', 'Communication'],
    industry_usage: { 'management': 0.9, 'tech': 0.7, 'consulting': 0.8 },
    experience_levels: ['middle', 'senior', 'lead']
  },
  {
    skill_name: 'Agile',
    category: 'methodology',
    subcategory: 'project_management',
    aliases: ['Agile Methodology', 'Agile Development'],
    related_skills: ['Scrum', 'Kanban', 'Project Management', 'Team Leadership'],
    industry_usage: { 'tech': 0.9, 'consulting': 0.8, 'enterprise': 0.7 },
    experience_levels: ['middle', 'senior', 'lead']
  },
  {
    skill_name: 'Communication',
    category: 'soft_skills',
    subcategory: 'interpersonal',
    aliases: ['Verbal Communication', 'Written Communication'],
    related_skills: ['Presentation Skills', 'Teamwork', 'Leadership'],
    industry_usage: { 'all': 0.9 },
    experience_levels: ['junior', 'middle', 'senior', 'lead']
  },

  // Languages
  {
    skill_name: 'English',
    category: 'languages',
    subcategory: 'spoken',
    aliases: ['English Language'],
    related_skills: ['Communication', 'Technical Writing'],
    industry_usage: { 'international': 0.9, 'tech': 0.8 },
    experience_levels: ['junior', 'middle', 'senior', 'lead']
  },
  {
    skill_name: 'Russian',
    category: 'languages',
    subcategory: 'spoken',
    aliases: ['Русский язык'],
    related_skills: ['Communication'],
    industry_usage: { 'local': 0.8, 'eastern_europe': 0.9 },
    experience_levels: ['junior', 'middle', 'senior', 'lead']
  }
];

async function initializeSkillsKnowledge() {
  try {
    console.log('Initializing skills knowledge base...');

    // Clear existing data
    const { error: deleteError } = await supabase
      .from('skills_knowledge')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) {
      console.error('Error clearing existing skills:', deleteError);
    }

    // Insert new skills data
    const { data, error } = await supabase
      .from('skills_knowledge')
      .insert(skillsData);

    if (error) {
      console.error('Error inserting skills:', error);
      return;
    }

    console.log(`Successfully initialized ${skillsData.length} skills in knowledge base`);

    // Verify insertion
    const { data: count, error: countError } = await supabase
      .from('skills_knowledge')
      .select('id', { count: 'exact' });

    if (countError) {
      console.error('Error counting skills:', countError);
    } else {
      console.log(`Total skills in database: ${count?.length || 0}`);
    }

  } catch (error) {
    console.error('Error initializing skills knowledge:', error);
  }
}

// Run the initialization
initializeSkillsKnowledge();
