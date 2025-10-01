import { createContext, useContext, useEffect, useState } from "react";

type Language = "zh" | "en";

type LanguageProviderProps = {
  children: React.ReactNode;
  defaultLanguage?: Language;
};

type LanguageProviderState = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
};

const translations = {
  zh: {
    // Header
    "nav.howItWorks": "工作原理",
    "nav.forProviders": "需求方",
    "nav.forPerformers": "任务执行者",
    "button.login": "登录",
    "button.getStarted": "开始使用",
    
    // Hero
    "hero.aiDriven": "AI驱动的智能匹配",
    "hero.title1": "将需求转化为机会",
    "hero.title2": "将潜力转化为价值",
    "hero.description": "Bridge不是招聘网站，而是一个动态、智能的需求-潜力实时匹配协议。用自然语言描述需求，AI自动拆解任务，精准匹配最合适的人才。",
    "hero.postDemand": "发布需求",
    "hero.buildPotential": "构建潜力图谱",
    "hero.stats.tasksCompleted": "任务已完成",
    "hero.stats.matches": "成功匹配",
    "hero.stats.skills": "技能维度",
    
    // How It Works
    "howItWorks.title": "工作原理",
    "howItWorks.subtitle": "四步实现从需求到价值的转化",
    "howItWorks.step1.title": "自然语言描述需求",
    "howItWorks.step1.desc": "用一句话描述你的问题或目标，无需复杂的职位描述",
    "howItWorks.step2.title": "AI智能解析",
    "howItWorks.step2.desc": "AI代理自动将需求拆解为具体的微任务，并估算技能要求",
    "howItWorks.step3.title": "精准智能匹配",
    "howItWorks.step3.desc": "基于潜力图谱，系统自动匹配最合适的人才完成任务",
    "howItWorks.step4.title": "完成与认证",
    "howItWorks.step4.desc": "任务完成后获得经验凭证，持续构建你的能力证明",
    
    // Home Roles
    "roles.title": "选择你的角色",
    "roles.subtitle": "无论你是需求方还是任务执行者，Bridge都能为你创造价值",
    "roles.provider.title": "需求方",
    "roles.provider.desc": "用一句话描述你的需求，AI帮你拆解任务，精准匹配最合适的人才",
    "roles.provider.feature1": "自然语言描述需求",
    "roles.provider.feature2": "AI智能任务拆解",
    "roles.provider.feature3": "精准人才匹配",
    "roles.provider.button": "发布需求",
    "roles.performer.title": "任务执行者",
    "roles.performer.desc": "完成能力挑战，构建潜力图谱，接收精准匹配的任务机会",
    "roles.performer.feature1": "完成能力挑战",
    "roles.performer.feature2": "构建潜力图谱",
    "roles.performer.feature3": "接收匹配任务",
    "roles.performer.button": "开始挑战",
    
    // Skills
    "skill.logic": "逻辑",
    "skill.creative": "创意",
    "skill.technical": "技术",
    "skill.communication": "沟通",
    
    // Common
    "common.viewDetails": "查看详情",
    "common.match": "匹配",
    "common.difficulty.beginner": "初级",
    "common.difficulty.intermediate": "中级",
    "common.difficulty.advanced": "高级",
    "common.difficulty.easy": "简单",
    "common.difficulty.medium": "中等",
    "common.difficulty.hard": "困难",
    "common.points": "积分",
    "common.startChallenge": "开始挑战",
    "common.reviewing": "查看详情",
    
    // Dashboard Provider
    "providerDash.title": "需求方控制台",
    "providerDash.subtitle": "发布需求，管理项目，查看匹配人才",
    "providerDash.activeProjects": "活跃项目",
    "providerDash.inProgress": "个进行中",
    "providerDash.completedTasks": "已完成任务",
    "providerDash.successRate": "成功率",
    "providerDash.matchedTalents": "匹配人才",
    "providerDash.avgMatch": "平均匹配度",
    "providerDash.recentProjects": "最近项目",
    "providerDash.daysAgo": "天前",
    "providerDash.microTasks": "个微任务",
    "providerDash.ongoing": "进行中",
    
    // Dashboard Performer
    "performerDash.title": "任务执行者控制台",
    "performerDash.subtitle": "完成挑战，接收任务，提升技能",
    "performerDash.totalPoints": "总积分",
    "performerDash.thisMonth": "本月",
    "performerDash.completedChallenges": "已完成挑战",
    "performerDash.avgScore": "平均得分",
    "performerDash.completedTasks": "完成任务",
    "performerDash.earnings": "收入",
    "performerDash.achievements": "成就徽章",
    "performerDash.recommendedTasks": "推荐任务",
    "performerDash.basedOnPotential": "基于你的潜力图谱",
    "performerDash.challenges": "能力挑战",
    "performerDash.improvePotential": "提升你的潜力分数",
    
    // Demand Input
    "demandInput.title": "描述你的需求",
    "demandInput.placeholder": "例如：我想为我的新款环保咖啡杯做一波小红书推广...",
    "demandInput.hint": "用自然语言描述，AI会帮你拆解成具体任务",
    "demandInput.analyze": "AI解析",
    "demandInput.analyzing": "分析中...",
    
    // Task Breakdown
    "taskBreakdown.title": "AI解析结果",
    "taskBreakdown.originalDemand": "原始需求",
    "taskBreakdown.decomposed": "已拆解为",
    "taskBreakdown.microTasks": "个微任务",
    "taskBreakdown.detail": "详情",
    "taskBreakdown.totalBudget": "预估总预算",
    "taskBreakdown.publishProject": "发布项目",
    "taskBreakdown.status.pending": "待匹配",
    "taskBreakdown.status.matched": "已匹配",
    "taskBreakdown.status.completed": "已完成",
    
    // Potential Radar
    "potentialRadar.title": "潜力图谱",
    "potentialRadar.overallScore": "综合评分",
    
    // Footer
    "footer.tagline": "将需求转化为机会，将潜力转化为价值",
  },
  en: {
    // Header
    "nav.howItWorks": "How It Works",
    "nav.forProviders": "For Providers",
    "nav.forPerformers": "For Performers",
    "button.login": "Login",
    "button.getStarted": "Get Started",
    
    // Hero
    "hero.aiDriven": "AI-Driven Smart Matching",
    "hero.title1": "Transform Demands into Opportunities",
    "hero.title2": "Transform Potential into Value",
    "hero.description": "Bridge is not a recruitment website, but a dynamic, intelligent demand-potential real-time matching protocol. Describe demands in natural language, AI automatically breaks down tasks, and precisely matches the most suitable talent.",
    "hero.postDemand": "Post Demand",
    "hero.buildPotential": "Build Potential",
    "hero.stats.tasksCompleted": "Tasks Completed",
    "hero.stats.matches": "Successful Matches",
    "hero.stats.skills": "Skill Dimensions",
    
    // How It Works
    "howItWorks.title": "How It Works",
    "howItWorks.subtitle": "Four steps to transform demands into value",
    "howItWorks.step1.title": "Natural Language Description",
    "howItWorks.step1.desc": "Describe your problem or goal in one sentence, no complex job descriptions needed",
    "howItWorks.step2.title": "AI Smart Analysis",
    "howItWorks.step2.desc": "AI agent automatically breaks down demands into specific micro-tasks and estimates skill requirements",
    "howItWorks.step3.title": "Precise Smart Matching",
    "howItWorks.step3.desc": "Based on potential profiles, the system automatically matches the most suitable talent",
    "howItWorks.step4.title": "Completion & Certification",
    "howItWorks.step4.desc": "Receive experience credentials after task completion, continuously building your capability proof",
    
    // Home Roles
    "roles.title": "Choose Your Role",
    "roles.subtitle": "Whether you're a demand provider or task performer, Bridge creates value for you",
    "roles.provider.title": "Demand Provider",
    "roles.provider.desc": "Describe your demand in one sentence, AI helps break down tasks and precisely match the most suitable talent",
    "roles.provider.feature1": "Natural language demand description",
    "roles.provider.feature2": "AI smart task breakdown",
    "roles.provider.feature3": "Precise talent matching",
    "roles.provider.button": "Post Demand",
    "roles.performer.title": "Task Performer",
    "roles.performer.desc": "Complete capability challenges, build potential profile, receive precisely matched task opportunities",
    "roles.performer.feature1": "Complete capability challenges",
    "roles.performer.feature2": "Build potential profile",
    "roles.performer.feature3": "Receive matched tasks",
    "roles.performer.button": "Start Challenge",
    
    // Skills
    "skill.logic": "Logic",
    "skill.creative": "Creative",
    "skill.technical": "Technical",
    "skill.communication": "Communication",
    
    // Common
    "common.viewDetails": "View Details",
    "common.match": "Match",
    "common.difficulty.beginner": "Beginner",
    "common.difficulty.intermediate": "Intermediate",
    "common.difficulty.advanced": "Advanced",
    "common.difficulty.easy": "Easy",
    "common.difficulty.medium": "Medium",
    "common.difficulty.hard": "Hard",
    "common.points": "Points",
    "common.startChallenge": "Start Challenge",
    "common.reviewing": "Review",
    
    // Dashboard Provider
    "providerDash.title": "Provider Dashboard",
    "providerDash.subtitle": "Post demands, manage projects, view matched talents",
    "providerDash.activeProjects": "Active Projects",
    "providerDash.inProgress": " in progress",
    "providerDash.completedTasks": "Completed Tasks",
    "providerDash.successRate": "Success Rate",
    "providerDash.matchedTalents": "Matched Talents",
    "providerDash.avgMatch": "Avg Match",
    "providerDash.recentProjects": "Recent Projects",
    "providerDash.daysAgo": " days ago",
    "providerDash.microTasks": " micro-tasks",
    "providerDash.ongoing": "Ongoing",
    
    // Dashboard Performer
    "performerDash.title": "Performer Dashboard",
    "performerDash.subtitle": "Complete challenges, receive tasks, improve skills",
    "performerDash.totalPoints": "Total Points",
    "performerDash.thisMonth": "This month",
    "performerDash.completedChallenges": "Completed Challenges",
    "performerDash.avgScore": "Avg Score",
    "performerDash.completedTasks": "Completed Tasks",
    "performerDash.earnings": "Earnings",
    "performerDash.achievements": "Achievements",
    "performerDash.recommendedTasks": "Recommended Tasks",
    "performerDash.basedOnPotential": "Based on your potential profile",
    "performerDash.challenges": "Capability Challenges",
    "performerDash.improvePotential": "Improve your potential score",
    
    // Demand Input
    "demandInput.title": "Describe Your Demand",
    "demandInput.placeholder": "e.g., I want to promote my new eco-friendly coffee cup on Xiaohongshu...",
    "demandInput.hint": "Describe in natural language, AI will break it down into specific tasks",
    "demandInput.analyze": "AI Analyze",
    "demandInput.analyzing": "Analyzing...",
    
    // Task Breakdown
    "taskBreakdown.title": "AI Analysis Result",
    "taskBreakdown.originalDemand": "Original Demand",
    "taskBreakdown.decomposed": "Decomposed into",
    "taskBreakdown.microTasks": " micro-tasks",
    "taskBreakdown.detail": "Detail",
    "taskBreakdown.totalBudget": "Estimated Total Budget",
    "taskBreakdown.publishProject": "Publish Project",
    "taskBreakdown.status.pending": "Pending",
    "taskBreakdown.status.matched": "Matched",
    "taskBreakdown.status.completed": "Completed",
    
    // Potential Radar
    "potentialRadar.title": "Potential Profile",
    "potentialRadar.overallScore": "Overall Score",
    
    // Footer
    "footer.tagline": "Transform demands into opportunities, transform potential into value",
  },
};

const LanguageProviderContext = createContext<LanguageProviderState | undefined>(
  undefined
);

export function LanguageProvider({
  children,
  defaultLanguage = "zh",
}: LanguageProviderProps) {
  const [language, setLanguage] = useState<Language>(
    () => (localStorage.getItem("language") as Language) || defaultLanguage
  );

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageProviderContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageProviderContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageProviderContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
