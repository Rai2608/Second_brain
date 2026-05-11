import { useState, useEffect, useRef } from 'react';
import { 
  Brain, Search, Calendar, FileText, CheckSquare, 
  Network, AlertCircle, RefreshCw, Mail, MessageSquare, ArrowRight,
  Database, User, Clock, Check, X, Users, Briefcase, ChevronRight,
  Plus, Info, Terminal, ExternalLink, HardDrive
} from 'lucide-react';
import './App.css';

// ==========================================
// Interfaces and Types
// ==========================================

interface GraphNode {
  id: string;
  label: string;
  type: 'person' | 'document' | 'meeting' | 'task' | 'project';
  role?: string;
  platform?: string;
  url?: string;
  date?: string;
  priority?: string;
  status?: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface GraphLink {
  source: string;
  target: string;
  relation: string;
}

interface Task {
  id: string;
  title: string;
  platform: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'Completed';
  dueDate: string;
  assignee?: string;
}

interface Conversation {
  id: string;
  title: string;
  sender: string;
  platform: 'Slack' | 'Gmail';
  text: string;
  time: string;
  extracted: boolean;
  tasks: {
    title: string;
    dueDate: string;
    priority: 'High' | 'Medium' | 'Low';
    assignee: string;
  }[];
}

interface IngestionLog {
  id: string;
  platform: string;
  title: string;
  action: string;
  time: string;
}

// ==========================================
// Initial Static Data
// ==========================================

const INITIAL_NODES: GraphNode[] = [
  { id: 'p1', label: 'Sarah Lin', type: 'person', role: 'Product Lead', x: 0, y: 0, vx: 0, vy: 0 },
  { id: 'p2', label: 'Alex Rivera', type: 'person', role: 'Tech Lead', x: 0, y: 0, vx: 0, vy: 0 },
  { id: 'p3', label: 'Jessica Chen', type: 'person', role: 'QA Engineer', x: 0, y: 0, vx: 0, vy: 0 },
  { id: 'doc1', label: 'Product Onboarding Spec', type: 'document', platform: 'Notion', url: 'https://notion.so/synapse/onboarding-spec', x: 0, y: 0, vx: 0, vy: 0 },
  { id: 'doc2', label: 'API Onboarding Spec', type: 'document', platform: 'Notion', url: 'https://notion.so/synapse/api-onboarding', x: 0, y: 0, vx: 0, vy: 0 },
  { id: 'doc3', label: 'User Feedback V2', type: 'document', platform: 'Drive', url: 'https://drive.google.com/synapse/feedback-v2', x: 0, y: 0, vx: 0, vy: 0 },
  { id: 'meet1', label: 'Weekly Sync Onboarding', type: 'meeting', date: 'May 10, 2026', platform: 'Calendar', x: 0, y: 0, vx: 0, vy: 0 },
  { id: 'meet2', label: 'Design System Review', type: 'meeting', date: 'May 08, 2026', platform: 'Calendar', x: 0, y: 0, vx: 0, vy: 0 },
  { id: 'task1', label: 'Fix Auth Token Refresh Bug', type: 'task', priority: 'High', platform: 'Jira', x: 0, y: 0, vx: 0, vy: 0 },
  { id: 'task2', label: 'Draft API Documentation', type: 'task', priority: 'Medium', platform: 'Jira', x: 0, y: 0, vx: 0, vy: 0 },
  { id: 'proj1', label: 'Synapse Beta Rollout', type: 'project', status: 'Active', x: 0, y: 0, vx: 0, vy: 0 },
];

const INITIAL_LINKS: GraphLink[] = [
  { source: 'p1', target: 'proj1', relation: 'Manages' },
  { source: 'p2', target: 'proj1', relation: 'Develops' },
  { source: 'p2', target: 'task1', relation: 'Assigned to' },
  { source: 'p1', target: 'meet1', relation: 'Organizes' },
  { source: 'p2', target: 'meet1', relation: 'Attends' },
  { source: 'doc1', target: 'proj1', relation: 'Defines' },
  { source: 'doc2', target: 'doc1', relation: 'References' },
  { source: 'meet1', target: 'doc1', relation: 'Discussed' },
  { source: 'task1', target: 'proj1', relation: 'Part of' },
  { source: 'task2', target: 'doc2', relation: 'Implements' },
  { source: 'p3', target: 'task1', relation: 'Verifies' },
  { source: 'p1', target: 'doc3', relation: 'Analyzed' },
  { source: 'doc3', target: 'proj1', relation: 'Informs' },
];

const INITIAL_TASKS: Task[] = [
  { id: 't-1', title: 'Schedule team onboarding workshop', platform: 'Google Calendar', priority: 'Medium', status: 'Pending', dueDate: 'May 14, 2026', assignee: 'Sarah Lin' },
  { id: 't-2', title: 'Review API onboarding documentation', platform: 'Notion', priority: 'High', status: 'Pending', dueDate: 'May 12, 2026', assignee: 'Alex Rivera' },
  { id: 't-3', title: 'Follow up with client feedback on Spec V2', platform: 'Gmail', priority: 'High', status: 'Completed', dueDate: 'May 10, 2026', assignee: 'Sarah Lin' },
];

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'c-1',
    title: 'Authentication & Refresh Tokens',
    sender: 'Alex Rivera (Slack #dev-channel)',
    platform: 'Slack',
    text: 'Hey team, the OAuth token expiration is causing errors during session restore. We need to fix the Auth Token Refresh bug by Friday, or else the beta rollout will be blocked. I am taking this up, but Jessica, can you verify the changes on staging once ready?',
    time: '10 mins ago',
    extracted: false,
    tasks: [
      { title: 'Fix Auth Token Refresh Bug', dueDate: 'May 15, 2026', priority: 'High', assignee: 'Alex Rivera' },
      { title: 'Verify auth refresh changes on staging', dueDate: 'May 16, 2026', priority: 'Medium', assignee: 'Jessica Chen' }
    ]
  },
  {
    id: 'c-2',
    title: 'Onboarding Project Assets',
    sender: 'Sarah Lin (Gmail thread)',
    platform: 'Gmail',
    text: 'Hi all, I have drafted the Product Onboarding Spec in Notion. Let\'s schedule the Weekly Sync Onboarding tomorrow to discuss. Also, we need someone to draft the API onboarding guide based on our spec references. Alex, could you take care of this next week?',
    time: '24 mins ago',
    extracted: false,
    tasks: [
      { title: 'Draft API onboarding guide', dueDate: 'May 20, 2026', priority: 'Medium', assignee: 'Alex Rivera' },
      { title: 'Prepare slides for Onboarding Weekly Sync', dueDate: 'May 12, 2026', priority: 'High', assignee: 'Sarah Lin' }
    ]
  },
  {
    id: 'c-3',
    title: 'User Experience Feedback',
    sender: 'Sarah Lin (Slack #pm-feedback)',
    platform: 'Slack',
    text: 'Received User Feedback V2 document from our pilot group. The overall reception is great, but we must optimize search load times. I have uploaded the feedback to Google Drive. Let\'s analyze user concerns before the review meeting.',
    time: '1 hour ago',
    extracted: true,
    tasks: [
      { title: 'Analyze User Feedback V2 document', dueDate: 'May 13, 2026', priority: 'High', assignee: 'Sarah Lin' }
    ]
  }
];

const SUGGESTED_LOGS: IngestionLog[] = [
  { id: 'log1', platform: 'Gmail', title: 'Email: Pilot Launch Timeline', action: 'Ingested and summarized', time: 'Just now' },
  { id: 'log2', platform: 'Slack', title: 'Channel: #product-design-review', action: 'Analyzed message context', time: '1 min ago' },
  { id: 'log3', platform: 'Drive', title: 'Doc: Synapse Database Schema', action: 'Vectorized 14 paragraphs', time: '2 mins ago' },
  { id: 'log4', platform: 'Notion', title: 'Page: Onboarding Roadmap v1.2', action: 'Updated Knowledge Graph links', time: '3 mins ago' },
];

function App() {
  // ==========================================
  // App States
  // ==========================================
  const [activeTab, setActiveTab] = useState<'dashboard' | 'search' | 'tasks' | 'graph' | 'integrations'>('dashboard');
  const [integrations, setIntegrations] = useState({
    gmail: true,
    slack: true,
    notion: true,
    drive: true,
    calendar: true,
    jira: false,
  });

  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [activeConvo, setActiveConvo] = useState<Conversation>(INITIAL_CONVERSATIONS[0]);
  
  // Knowledge Graph states
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [graphLinks, setGraphLinks] = useState<GraphLink[]>(INITIAL_LINKS);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [nodeCategoryFilter, setNodeCategoryFilter] = useState<string>('all');
  const [graphSearchQuery, setGraphSearchQuery] = useState<string>('');

  // Search Engine States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchAnswer, setSearchAnswer] = useState<string | null>(null);
  const [searchSources, setSearchSources] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchConfidence, setSearchConfidence] = useState<number | null>(null);
  const [searchRelatedTasks, setSearchRelatedTasks] = useState<string[]>([]);

  // Ingestion Log Stream States
  const [ingestionLogs, setIngestionLogs] = useState<IngestionLog[]>(SUGGESTED_LOGS);

  // Jira OAuth Connecting Simulation
  const [isConnectingJira, setIsConnectingJira] = useState(false);
  const [jiraConnectionStep, setJiraConnectionStep] = useState('');

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Time & Greeting State
  const [greeting, setGreeting] = useState('Welcome back');
  const [currentTime, setCurrentTime] = useState('');

  // Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);
  const dragNodeRef = useRef<GraphNode | null>(null);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const hoverNodeRef = useRef<GraphNode | null>(null);

  // ==========================================
  // Helper: Trigger Toast Notification
  // ==========================================
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // ==========================================
  // Dynamic Greeting and Time Updates
  // ==========================================
  useEffect(() => {
    // Set initial greeting
    const hrs = new Date().getHours();
    if (hrs < 12) setGreeting('Good morning');
    else if (hrs < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    // Time ticker
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // ==========================================
  // Dynamic AI Processing Log Feed Simulation
  // ==========================================
  useEffect(() => {
    const documentsPool = [
      { title: 'Product Specification V3', platform: 'Drive' },
      { title: 'API Gateway Authentication Strategy', platform: 'Notion' },
      { title: 'Slack message: PM-Feedback channel critique', platform: 'Slack' },
      { title: 'Email: Schedule client onboarding webinar', platform: 'Gmail' },
      { title: 'Issue JIRA-402: Refresh token expiry testing', platform: 'Jira' },
      { title: 'Meeting Invite: Dev Sync on security spec', platform: 'Calendar' },
    ];

    const actionsPool = [
      'Indexed text content and stored 12 vector embeddings',
      'Detected actionable commitment and extracted draft task',
      'Extracted entity linkages and expanded Knowledge Graph',
      'Resolved contextual relationship with 94% confidence',
      'Analyzed conversation sentiments and highlighted actionables',
    ];

    const interval = setInterval(() => {
      // Only generate if integrations are connected
      const availablePlatforms = Object.entries(integrations)
        .filter(([_, isConnected]) => isConnected)
        .map(([platform]) => platform);

      if (availablePlatforms.length === 0) return;

      const randomPlatform = availablePlatforms[Math.floor(Math.random() * availablePlatforms.length)];
      const platCamel = randomPlatform.charAt(0).toUpperCase() + randomPlatform.slice(1);
      
      const matchedDocs = documentsPool.filter(d => d.platform.toLowerCase() === randomPlatform.toLowerCase());
      const selectedDoc = matchedDocs.length > 0 
        ? matchedDocs[Math.floor(Math.random() * matchedDocs.length)].title 
        : `Resource item on ${platCamel}`;

      const randomAction = actionsPool[Math.floor(Math.random() * actionsPool.length)];

      const newLog: IngestionLog = {
        id: `log-${Date.now()}`,
        platform: platCamel,
        title: selectedDoc,
        action: randomAction,
        time: 'Just now'
      };

      setIngestionLogs(prev => [newLog, ...prev.slice(0, 5)]);
    }, 4500);

    return () => clearInterval(interval);
  }, [integrations]);

  // ==========================================
  // Initialize and Reset Knowledge Graph Coordinates
  // ==========================================
  useEffect(() => {
    // Populate graph node array with positions if they are unitialized (0,0)
    const initNodes = INITIAL_NODES.map((node, idx) => {
      // Arrange in a neat circular spread to kickstart force simulation nicely
      const angle = (idx / INITIAL_NODES.length) * Math.PI * 2;
      const radius = 180;
      return {
        ...node,
        x: 400 + Math.cos(angle) * radius,
        y: 250 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
      };
    });
    setGraphNodes(initNodes);
    // Set initial selected node
    setSelectedNode(initNodes[0]);
  }, []);

  // ==========================================
  // Simulated Jira Connection Handshake
  // ==========================================
  const connectJira = () => {
    if (integrations.jira) {
      // Disconnect
      setIntegrations(prev => ({ ...prev, jira: false }));
      // Remove Jira nodes from active graph
      setGraphNodes(prev => prev.filter(n => n.platform !== 'Jira'));
      triggerToast('Jira Integration Disconnected.');
      return;
    }

    setIsConnectingJira(true);
    setJiraConnectionStep('1. Initiating secure OAuth 2.0 connection standard with Atlassian...');

    setTimeout(() => {
      setJiraConnectionStep('2. Handshake successful. Mapping issue database and agile boards...');
    }, 1500);

    setTimeout(() => {
      setJiraConnectionStep('3. Analysing task context and cross-referencing with Slack threads...');
    }, 3000);

    setTimeout(() => {
      setJiraConnectionStep('4. Adding 2 Jira tickets and 4 context relationships to Knowledge Graph...');
    }, 4200);

    setTimeout(() => {
      // Finalize Connection
      setIntegrations(prev => ({ ...prev, jira: true }));
      setIsConnectingJira(false);
      setJiraConnectionStep('');

      // Add Jira Nodes to current graph
      const jiraNodes: GraphNode[] = [
        { id: 'task1', label: 'Fix Auth Token Refresh Bug', type: 'task', priority: 'High', platform: 'Jira', x: 450, y: 350, vx: 0, vy: 0 },
        { id: 'task2', label: 'Draft API Documentation', type: 'task', priority: 'Medium', platform: 'Jira', x: 250, y: 150, vx: 0, vy: 0 }
      ];

      setGraphNodes(prev => {
        // filter duplicates first
        const filtered = prev.filter(n => n.id !== 'task1' && n.id !== 'task2');
        return [...filtered, ...jiraNodes];
      });

      triggerToast('Jira successfully synchronized! 2 Tasks and 4 relationships registered.');
    }, 5500);
  };

  // ==========================================
  // Simulated AI Unified Search Logic
  // ==========================================
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchAnswer(null);

    // Contextual responses pool
    setTimeout(() => {
      const queryLower = searchQuery.toLowerCase();
      let answerText = '';
      let sourcesList: any[] = [];
      let confidenceScore = 95;
      let related: string[] = [];

      if (queryLower.includes('onboarding') || queryLower.includes('decide')) {
        answerText = `Based on your **Slack discussions** and the **Notion spec**, the team decided on **May 10** to finalize the onboarding schema. Product Lead **Sarah Lin** completed the main **Product Onboarding Spec** on Notion, and **Alex Rivera** was assigned to draft the technical **API Onboarding Spec** which directly references Sarah\'s spec. This onboarding sync was discussed during the "Weekly Sync Onboarding" calendar meeting.`;
        sourcesList = [
          { title: 'Product Onboarding Spec', platform: 'Notion', icon: FileText, url: 'https://notion.so/synapse/onboarding-spec' },
          { title: 'Weekly Sync Onboarding Meeting', platform: 'Calendar', icon: Calendar, url: '#' },
          { title: 'Slack discussion: Onboarding Assets', platform: 'Slack', icon: MessageSquare, url: '#' },
        ];
        confidenceScore = 98;
        related = ['Draft API onboarding guide', 'Prepare slides for Onboarding Weekly Sync'];
      } else if (queryLower.includes('block') || queryLower.includes('auth') || queryLower.includes('ref')) {
        answerText = `A critical blocker has been identified in the **Synapse Beta Rollout** project. The **Auth Token Refresh bug** causes user sessions to expire unexpectedly during restore. According to Slack threads from 10 minutes ago, **Alex Rivera** is investigating this. **Jessica Chen** has been tagged to verify the fix on the staging environment. This is tracked in Jira as an unresolved High-priority task.`;
        sourcesList = [
          { title: 'Slack chat: Alex Rivera', platform: 'Slack', icon: MessageSquare, url: '#' },
          { title: 'Jira: Fix Auth Token Refresh Bug', platform: 'Jira', icon: CheckSquare, url: '#' },
          { title: 'Project: Synapse Beta Rollout', platform: 'Project', icon: Briefcase, url: '#' },
        ];
        confidenceScore = 94;
        related = ['Fix Auth Token Refresh Bug', 'Verify auth refresh changes on staging'];
      } else if (queryLower.includes('feedback') || queryLower.includes('user') || queryLower.includes('opinion')) {
        answerText = `Synapse analyzed the **User Feedback V2** PDF uploaded by **Sarah Lin** to Google Drive 1 hour ago. The overall user sentiment is highly positive (8.2/10), but multiple participants highlighted that search query latency needs to be optimized. Sarah suggested analyzing these latency concerns prior to scheduling our next sprint design review.`;
        sourcesList = [
          { title: 'User Feedback V2.pdf', platform: 'Drive', icon: HardDrive, url: 'https://drive.google.com/synapse/feedback-v2' },
          { title: 'Slack discussion: PM Feedback', platform: 'Slack', icon: MessageSquare, url: '#' },
        ];
        confidenceScore = 91;
        related = ['Analyze User Feedback V2 document'];
      } else {
        // Fallback semantic search
        answerText = `I searched your second brain for "${searchQuery}". While there are no explicit exact matches, I found contextual relationships across your connected Slack history and Notion files. The team has been actively collaborating on the "Synapse Beta Rollout" and technical specs authored by Sarah Lin and Alex Rivera. Let me know if you would like me to generate a new project card or trace references.`;
        sourcesList = [
          { title: 'Product Onboarding Spec', platform: 'Notion', icon: FileText, url: 'https://notion.so/synapse/onboarding-spec' },
          { title: 'Synapse Beta Rollout', platform: 'Project', icon: Briefcase, url: '#' }
        ];
        confidenceScore = 82;
        related = ['Review API onboarding documentation'];
      }

      setIsSearching(false);
      setSearchAnswer(answerText);
      setSearchSources(sourcesList);
      setSearchConfidence(confidenceScore);
      setSearchRelatedTasks(related);
      TypewriterIndex(0); // Trigger typing effect if desired, but we can display normally
    }, 1800);
  };

  // ==========================================
  // Action Handler: Task Extraction from Conversation
  // ==========================================
  const extractTasksFromConvo = (convoId: string) => {
    // Locate conversation
    const convoIdx = conversations.findIndex(c => c.id === convoId);
    if (convoIdx === -1 || conversations[convoIdx].extracted) return;

    const convo = conversations[convoIdx];
    
    // Add these tasks to our master list
    const newTasks: Task[] = convo.tasks.map((t, idx) => ({
      id: `t-extracted-${Date.now()}-${idx}`,
      title: t.title,
      platform: convo.platform,
      priority: t.priority,
      status: 'Pending',
      dueDate: t.dueDate,
      assignee: t.assignee
    }));

    setTasks(prev => [...newTasks, ...prev]);

    // Mark convo as extracted
    setConversations(prev => {
      const copy = [...prev];
      copy[convoIdx] = { ...copy[convoIdx], extracted: true };
      return copy;
    });

    // Update current active convo in UI view
    setActiveConvo(prev => ({ ...prev, extracted: true }));

    // Dynamically insert task nodes in knowledge graph
    const newGraphNodes: GraphNode[] = newTasks.map((t, idx) => ({
      id: t.id,
      label: t.title,
      type: 'task',
      priority: t.priority,
      platform: t.platform,
      x: 300 + idx * 100,
      y: 200 + idx * 80,
      vx: 0,
      vy: 0
    }));

    setGraphNodes(prev => [...prev, ...newGraphNodes]);

    // Establish links between people, tasks, projects
    const newGraphLinks: GraphLink[] = [];
    newTasks.forEach(t => {
      // Find person ID
      let personId = 'p1'; // Sarah default
      if (t.assignee?.includes('Alex')) personId = 'p2';
      else if (t.assignee?.includes('Jessica')) personId = 'p3';

      newGraphLinks.push({ source: personId, target: t.id, relation: 'Assigned task' });
      newGraphLinks.push({ source: t.id, target: 'proj1', relation: 'Subtask of' });
    });

    setGraphLinks(prev => [...prev, ...newGraphLinks]);

    triggerToast(`AI Extracted ${newTasks.length} Task(s) successfully and mapped to Knowledge Graph!`);
  };

  // ==========================================
  // Toggle Task Status (Complete/Pending)
  // ==========================================
  const toggleTaskStatus = (taskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const nextStatus = t.status === 'Pending' ? 'Completed' : 'Pending';
        triggerToast(`Task marked as ${nextStatus}`);
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  };

  // ==========================================
  // Add a brand new task manually
  // ==========================================
  const handleAddTaskDirectly = (title: string, priority: 'High' | 'Medium' | 'Low', platform: string) => {
    const newTask: Task = {
      id: `t-manual-${Date.now()}`,
      title,
      platform,
      priority,
      status: 'Pending',
      dueDate: 'May 18, 2026',
      assignee: 'Sarah Lin'
    };
    setTasks(prev => [newTask, ...prev]);
    triggerToast('New task registered to board.');
  };

  // ==========================================
  // Physics-based Force-Directed Simulation for Knowledge Graph
  // ==========================================
  useEffect(() => {
    if (activeTab !== 'graph' || graphNodes.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI retina screens
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const simulationLoop = () => {
      const centerX = width / 2;
      const centerY = height / 2;

      // 1. Repulsion (Coulomb-like force between nodes)
      for (let i = 0; i < graphNodes.length; i++) {
        for (let j = i + 1; j < graphNodes.length; j++) {
          const nodeA = graphNodes[i];
          const nodeB = graphNodes[j];
          const dx = nodeB.x - nodeA.x;
          const dy = nodeB.y - nodeA.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          
          // If nodes are too close, repel them
          if (dist < 180) {
            const force = (180 - dist) * 0.08;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            nodeA.vx -= fx;
            nodeA.vy -= fy;
            nodeB.vx += fx;
            nodeB.vy += fy;
          }
        }
      }

      // 2. Attraction (Spring force along active links)
      graphLinks.forEach(link => {
        const sourceNode = graphNodes.find(n => n.id === link.source);
        const targetNode = graphNodes.find(n => n.id === link.target);
        
        if (sourceNode && targetNode) {
          const dx = targetNode.x - sourceNode.x;
          const dy = targetNode.y - sourceNode.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const desiredDist = 110;
          const springConstant = 0.03;
          
          const force = (dist - desiredDist) * springConstant;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          
          sourceNode.vx += fx;
          sourceNode.vy += fy;
          targetNode.vx -= fx;
          targetNode.vy -= fy;
        }
      });

      // 3. Central Gravity & Update Positions
      graphNodes.forEach(node => {
        // Pull slightly to center
        const dx = centerX - node.x;
        const dy = centerY - node.y;
        node.vx += dx * 0.005;
        node.vy += dy * 0.005;

        // Apply drag interaction lock
        if (dragNodeRef.current && dragNodeRef.current.id === node.id) {
          node.x = mousePosRef.current.x;
          node.y = mousePosRef.current.y;
          node.vx = 0;
          node.vy = 0;
        } else {
          // Standard velocity translation
          node.x += node.vx;
          node.y += node.vy;
          // Apply Friction (dampening)
          node.vx *= 0.72;
          node.vy *= 0.72;
        }

        // Constrain to viewport bounds with padding
        node.x = Math.max(40, Math.min(width - 40, node.x));
        node.y = Math.max(40, Math.min(height - 40, node.y));
      });

      // ------------------------------------------
      // Rendering Frame
      // ------------------------------------------
      ctx.clearRect(0, 0, width, height);

      // Subtle Background Grid Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw Connection Lines (Links)
      graphLinks.forEach(link => {
        const sourceNode = graphNodes.find(n => n.id === link.source);
        const targetNode = graphNodes.find(n => n.id === link.target);

        if (!sourceNode || !targetNode) return;

        // Filter connections by category filter if needed
        if (nodeCategoryFilter !== 'all') {
          if (sourceNode.type !== nodeCategoryFilter && targetNode.type !== nodeCategoryFilter) return;
        }

        const isRelatedToSelection = selectedNode && 
          (sourceNode.id === selectedNode.id || targetNode.id === selectedNode.id);

        // Highlight state
        if (isRelatedToSelection) {
          ctx.strokeStyle = 'rgba(168, 85, 247, 0.6)';
          ctx.lineWidth = 2.5;
        } else {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
          ctx.lineWidth = 1.2;
        }

        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);
        ctx.stroke();

        // Draw flowing data particles (animations!)
        if (isRelatedToSelection || Math.random() < 0.1) {
          const speedFactor = 0.005;
          const time = (Date.now() * speedFactor) % 1;
          const px = sourceNode.x + (targetNode.x - sourceNode.x) * time;
          const py = sourceNode.y + (targetNode.y - sourceNode.y) * time;

          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fillStyle = isRelatedToSelection ? '#c084fc' : '#22d3ee';
          ctx.shadowBlur = 10;
          ctx.shadowColor = isRelatedToSelection ? '#c084fc' : '#22d3ee';
          ctx.fill();
          ctx.shadowBlur = 0; // reset
        }

        // Relation text label in mid-point if highlighted
        if (isRelatedToSelection) {
          const midX = (sourceNode.x + targetNode.x) / 2;
          const midY = (sourceNode.y + targetNode.y) / 2;
          ctx.save();
          ctx.fillStyle = '#94a3b8';
          ctx.font = '500 9px "Plus Jakarta Sans"';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = '#000';
          ctx.shadowBlur = 4;
          ctx.fillText(link.relation, midX, midY - 6);
          ctx.restore();
        }
      });

      // Draw Nodes
      graphNodes.forEach(node => {
        // Filter node view if category is selected
        if (nodeCategoryFilter !== 'all' && node.type !== nodeCategoryFilter) return;

        // Draw Search Query Highlights
        const isSearchMatched = graphSearchQuery.trim() && 
          node.label.toLowerCase().includes(graphSearchQuery.toLowerCase());

        const isHovered = hoverNodeRef.current && hoverNodeRef.current.id === node.id;
        const isSelected = selectedNode && selectedNode.id === node.id;

        // Custom styling for types
        let primaryColor = '#6366f1'; // Default Indigo
        let glowColor = 'rgba(99, 102, 241, 0.4)';

        if (node.type === 'person') {
          primaryColor = '#06b6d4'; // Cyan
          glowColor = 'rgba(6, 182, 212, 0.4)';
        } else if (node.type === 'document') {
          primaryColor = '#10b981'; // Emerald
          glowColor = 'rgba(16, 185, 129, 0.4)';
        } else if (node.type === 'meeting') {
          primaryColor = '#f59e0b'; // Amber
          glowColor = 'rgba(245, 158, 11, 0.4)';
        } else if (node.type === 'task') {
          primaryColor = '#a855f7'; // Violet
          glowColor = 'rgba(168, 85, 247, 0.4)';
        } else if (node.type === 'project') {
          primaryColor = '#f43f5e'; // Rose
          glowColor = 'rgba(244, 63, 94, 0.4)';
        }

        ctx.save();

        // Node Glow Ring
        if (isSelected || isHovered || isSearchMatched) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, 24, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
          ctx.strokeStyle = primaryColor;
          ctx.lineWidth = isSelected ? 3 : 1.5;
          ctx.shadowBlur = 18;
          ctx.shadowColor = glowColor;
          ctx.fill();
          ctx.stroke();
          ctx.shadowBlur = 0; // reset
        } else {
          // Standard subtle node border
          ctx.beginPath();
          ctx.arc(node.x, node.y, 16, 0, Math.PI * 2);
          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = 1;
          ctx.fill();
          ctx.stroke();
        }

        // Draw inner core dot
        ctx.beginPath();
        ctx.arc(node.x, node.y, isSelected ? 10 : 8, 0, Math.PI * 2);
        ctx.fillStyle = primaryColor;
        ctx.fill();

        // Label Texts
        ctx.font = isSelected ? '700 11px "Outfit"' : '600 10px "Plus Jakarta Sans"';
        ctx.fillStyle = isSelected ? '#ffffff' : '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(node.label, node.x, node.y + (isSelected ? 28 : 20));

        // Sublabel
        if (isSelected || isHovered) {
          const subText = node.type === 'person' ? (node.role || '') : (node.platform || node.type);
          ctx.font = '500 8.5px "Plus Jakarta Sans"';
          ctx.fillStyle = '#94a3b8';
          ctx.fillText(subText, node.x, node.y + (isSelected ? 40 : 31));
        }

        ctx.restore();
      });

      requestRef.current = requestAnimationFrame(simulationLoop);
    };

    requestRef.current = requestAnimationFrame(simulationLoop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [activeTab, graphNodes, graphLinks, selectedNode, nodeCategoryFilter, graphSearchQuery]);

  // ==========================================
  // Canvas Mouse Interactions (Dragging & Hover)
  // ==========================================
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Detect if mouse click is on any node
    const clickedNode = graphNodes.find(node => {
      // Ignore if filtered out
      if (nodeCategoryFilter !== 'all' && node.type !== nodeCategoryFilter) return false;
      const dx = node.x - x;
      const dy = node.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < 25; // radius padding
    });

    if (clickedNode) {
      dragNodeRef.current = clickedNode;
      setSelectedNode(clickedNode);
      mousePosRef.current = { x, y };
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    mousePosRef.current = { x, y };

    // Handle Hover Node Tracking
    const hovered = graphNodes.find(node => {
      if (nodeCategoryFilter !== 'all' && node.type !== nodeCategoryFilter) return false;
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) < 22;
    }) || null;

    hoverNodeRef.current = hovered;
    canvas.style.cursor = hovered ? (dragNodeRef.current ? 'grabbing' : 'pointer') : 'grab';
  };

  const handleCanvasMouseUp = () => {
    dragNodeRef.current = null;
  };

  // Trigger search from suggestions
  const triggerSuggestionSearch = (text: string) => {
    setSearchQuery(text);
    // Submit search instantly
    setIsSearching(true);
    setSearchAnswer(null);
    setTimeout(() => {
      let answerText = '';
      let sourcesList: any[] = [];
      let confidenceScore = 95;
      let related: string[] = [];

      if (text.includes('onboarding')) {
        answerText = `Based on your **Slack discussions** and the **Notion spec**, the team decided on **May 10** to finalize the onboarding schema. Product Lead **Sarah Lin** completed the main **Product Onboarding Spec** on Notion, and **Alex Rivera** was assigned to draft the technical **API Onboarding Spec** which directly references Sarah\'s spec. This onboarding sync was discussed during the "Weekly Sync Onboarding" calendar meeting.`;
        sourcesList = [
          { title: 'Product Onboarding Spec', platform: 'Notion', icon: FileText, url: 'https://notion.so/synapse/onboarding-spec' },
          { title: 'Weekly Sync Onboarding Meeting', platform: 'Calendar', icon: Calendar, url: '#' },
          { title: 'Slack discussion: Onboarding Assets', platform: 'Slack', icon: MessageSquare, url: '#' },
        ];
        confidenceScore = 98;
        related = ['Draft API onboarding guide', 'Prepare slides for Onboarding Weekly Sync'];
      } else if (text.includes('blocker')) {
        answerText = `A critical blocker has been identified in the **Synapse Beta Rollout** project. The **Auth Token Refresh bug** causes user sessions to expire unexpectedly during restore. According to Slack threads from 10 minutes ago, **Alex Rivera** is investigating this. **Jessica Chen** has been tagged to verify the fix on the staging environment. This is tracked in Jira as an unresolved High-priority task.`;
        sourcesList = [
          { title: 'Slack chat: Alex Rivera', platform: 'Slack', icon: MessageSquare, url: '#' },
          { title: 'Jira: Fix Auth Token Refresh Bug', platform: 'Jira', icon: CheckSquare, url: '#' },
          { title: 'Project: Synapse Beta Rollout', platform: 'Project', icon: Briefcase, url: '#' },
        ];
        confidenceScore = 94;
        related = ['Fix Auth Token Refresh Bug', 'Verify auth refresh changes on staging'];
      } else {
        answerText = `Synapse analyzed the **User Feedback V2** PDF uploaded by **Sarah Lin** to Google Drive 1 hour ago. The overall user sentiment is highly positive (8.2/10), but multiple participants highlighted that search query latency needs to be optimized. Sarah suggested analyzing these latency concerns prior to scheduling our next sprint design review.`;
        sourcesList = [
          { title: 'User Feedback V2.pdf', platform: 'Drive', icon: HardDrive, url: 'https://drive.google.com/synapse/feedback-v2' },
          { title: 'Slack discussion: PM Feedback', platform: 'Slack', icon: MessageSquare, url: '#' },
        ];
        confidenceScore = 91;
        related = ['Analyze User Feedback V2 document'];
      }

      setIsSearching(false);
      setSearchAnswer(answerText);
      setSearchSources(sourcesList);
      setSearchConfidence(confidenceScore);
      setSearchRelatedTasks(related);
    }, 1200);
  };

  // Count helper functions
  const countPendingTasks = () => tasks.filter(t => t.status === 'Pending').length;
  const countConnectedSources = () => Object.values(integrations).filter(Boolean).length;

  return (
    <div id="app-container">
      {/* Toast notifications */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'rgba(15, 18, 28, 0.95)',
          border: '1px solid var(--color-primary)',
          boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)',
          borderRadius: '12px',
          padding: '16px 20px',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'slideUp 0.3s ease-out forwards',
          maxWidth: '380px'
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            background: 'rgba(99, 102, 241, 0.1)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary)'
          }}>
            <Brain size={16} />
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f8fafc' }}>Synapse Cortex</p>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>{toastMessage}</p>
          </div>
        </div>
      )}

      {/* LEFT NAVIGATION SIDEBAR */}
      <aside id="app-sidebar">
        <div className="sidebar-header">
          <div className="logo-icon-container">
            <Brain size={22} color="#fff" />
          </div>
          <div>
            <h1 className="logo-title" style={{ margin: 0, fontSize: '1.4rem' }}>SYNAPSE</h1>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.1em', marginTop: '2px' }}>AI SECOND BRAIN</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div 
            id="nav-dashboard"
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <Database className="nav-item-icon" />
            Daily Briefing
          </div>

          <div 
            id="nav-search"
            className={`nav-item ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            <Search className="nav-item-icon" />
            Unified Search
          </div>

          <div 
            id="nav-tasks"
            className={`nav-item ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            <CheckSquare className="nav-item-icon" />
            Task Extractor
            {countPendingTasks() > 0 && (
              <span style={{
                marginLeft: 'auto',
                background: 'rgba(168, 85, 247, 0.15)',
                color: '#c084fc',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '99px',
                border: '1px solid rgba(168, 85, 247, 0.3)'
              }}>
                {countPendingTasks()}
              </span>
            )}
          </div>

          <div 
            id="nav-graph"
            className={`nav-item ${activeTab === 'graph' ? 'active' : ''}`}
            onClick={() => setActiveTab('graph')}
          >
            <Network className="nav-item-icon" />
            Knowledge Graph
          </div>

          <div 
            id="nav-integrations"
            className={`nav-item ${activeTab === 'integrations' ? 'active' : ''}`}
            onClick={() => setActiveTab('integrations')}
          >
            <RefreshCw className="nav-item-icon" />
            Integration Hub
            {!integrations.jira && (
              <span style={{
                marginLeft: 'auto',
                width: '8px',
                height: '8px',
                background: 'var(--color-warning)',
                borderRadius: '50%'
              }} />
            )}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-avatar">PD</div>
          <div className="user-info">
            <span className="user-name">Paramita Das</span>
            <span className="user-status">
              <span className="live-dot"></span>
              Cortex Active
            </span>
          </div>
        </div>
      </aside>

      {/* RIGHT MAIN CONTAINER */}
      <main id="app-main">
        {/* HEADER NAVBAR */}
        <header id="app-navbar">
          <div className="breadcrumb">
            <span className="breadcrumb-root">Synapse v1.0</span>
            <ChevronRight size={14} className="breadcrumb-separator" />
            <span className="breadcrumb-current">
              {activeTab === 'dashboard' && 'Daily Briefing'}
              {activeTab === 'search' && 'Unified AI Search'}
              {activeTab === 'tasks' && 'Auto Task Extraction'}
              {activeTab === 'graph' && 'Knowledge Graph Engine'}
              {activeTab === 'integrations' && 'Integration Hub'}
            </span>
          </div>

          <div className="navbar-actions">
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} />
              <span>{currentTime || 'Clock active'}</span>
            </div>
            
            <div className="sync-status-indicator">
              <span className="dot"></span>
              <span>Proactive Sync Active ({countConnectedSources()} tools)</span>
            </div>
          </div>
        </header>

        {/* WORKSPACE VIEW CONTENT */}
        <div id="app-content">
          
          {/* ==========================================
              TAB 1: AI DAILY BRIEFING (DASHBOARD)
              ========================================== */}
          {activeTab === 'dashboard' && (
            <div className="animate-slide-up">
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '1.85rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                  {greeting}, Paramita Das
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '4px' }}>
                  Synapse has completed auditing your linked folders, calendars, and communications. Here is your unified intelligence briefing for today.
                </p>
              </div>

              {/* METRICS PANEL */}
              <div className="metrics-row">
                <div className="glass-panel metric-card glow-indigo">
                  <div className="metric-icon-wrapper" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--color-primary)' }}>
                    <RefreshCw size={22} />
                  </div>
                  <div className="metric-data">
                    <span className="metric-value">{countConnectedSources()} / 6</span>
                    <span className="metric-label">Connected Apps</span>
                  </div>
                </div>

                <div className="glass-panel metric-card glow-cyan">
                  <div className="metric-icon-wrapper" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--color-cyber)' }}>
                    <Network size={22} />
                  </div>
                  <div className="metric-data">
                    <span className="metric-value">{graphNodes.length} Nodes</span>
                    <span className="metric-label">Graph Relationships</span>
                  </div>
                </div>

                <div className="glass-panel metric-card glow-violet">
                  <div className="metric-icon-wrapper" style={{ background: 'rgba(168, 85, 247, 0.1)', color: 'var(--color-accent)' }}>
                    <CheckSquare size={22} />
                  </div>
                  <div className="metric-data">
                    <span className="metric-value">{countPendingTasks()} Pending</span>
                    <span className="metric-label">Tasks extracted</span>
                  </div>
                </div>

                <div className="glass-panel metric-card glow-indigo">
                  <div className="metric-icon-wrapper" style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e' }}>
                    <AlertCircle size={22} />
                  </div>
                  <div className="metric-data">
                    <span className="metric-value">2 Urgent</span>
                    <span className="metric-label">Action Blockers</span>
                  </div>
                </div>
              </div>

              {/* BRIEFING SECTIONS */}
              <div className="dashboard-grid">
                
                {/* LEFT MAIN BRIEFING PANEL */}
                <div className="glass-panel briefing-card">
                  <div className="card-title-container">
                    <h3 className="card-title">
                      <Brain size={18} color="var(--color-primary)" />
                      Personalized AI Intelligence Summary
                    </h3>
                    <span className="badge badge-indigo">May 11, 2026</span>
                  </div>

                  {/* Section 1: Project blockers */}
                  <div className="briefing-section">
                    <h4 className="briefing-section-title">Critical Project Blockers</h4>
                    <div className="briefing-item" style={{ borderLeft: '3px solid var(--color-error)' }}>
                      <div className="briefing-item-left">
                        <AlertCircle size={16} color="var(--color-error)" />
                        <div>
                          <p className="briefing-item-desc">Auth Token Refresh bug is blocking "Synapse Beta Rollout"</p>
                          <p className="briefing-item-meta">Alex Rivera is investigating on Slack. Jessica needs to verify on staging.</p>
                        </div>
                      </div>
                      <button className="btn btn-cyber" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => setActiveTab('search')}>
                        Search Context
                      </button>
                    </div>
                  </div>

                  {/* Section 2: Action Items */}
                  <div className="briefing-section">
                    <h4 className="briefing-section-title">Urgent Action Items</h4>
                    
                    <div className="briefing-item">
                      <div className="briefing-item-left">
                        <Mail size={16} color="var(--color-primary)" />
                        <div>
                          <p className="briefing-item-desc">Analyze Pilot Feedback PDF uploaded to Drive by Sarah Lin</p>
                          <p className="briefing-item-meta">Mentioned in pm-feedback channel. Needs completion prior to next Design review.</p>
                        </div>
                      </div>
                      <span className="badge badge-cyan">Google Drive</span>
                    </div>

                    <div className="briefing-item">
                      <div className="briefing-item-left">
                        <Calendar size={16} color="var(--color-warning)" />
                        <div>
                          <p className="briefing-item-desc">API Onboarding Spec drafting needs developer review</p>
                          <p className="briefing-item-meta">Assigned to Alex Rivera in Notion. Due in 3 days.</p>
                        </div>
                      </div>
                      <span className="badge badge-violet">Notion</span>
                    </div>
                  </div>

                  {/* Section 3: Semantic Connections */}
                  <div className="briefing-section" style={{ marginBottom: 0 }}>
                    <h4 className="briefing-section-title">Recent Proactive Context Connections</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
                      Synapse connected scattered pieces of information automatically based on semantic overlaps:
                    </p>
                    <ul style={{ paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <li>
                        Linked <span style={{ color: 'var(--color-cyber)', fontWeight: 600 }}>Product Onboarding Spec (Notion)</span> to <span style={{ color: 'var(--color-warning)', fontWeight: 600 }}>Weekly Sync Onboarding (Calendar)</span> due to high semantic discussion overlap.
                      </li>
                      <li>
                        Associated client critiques in Slack to the <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>User Feedback V2.pdf (Drive)</span>, enabling contextual search.
                      </li>
                    </ul>
                  </div>
                </div>

                {/* RIGHT COLUMN: LIVE DATA INGESTION STREAM */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* REAL-TIME SIMULATED STREAM CARD */}
                  <div className="glass-panel live-stream-container">
                    <div className="card-title-container" style={{ marginBottom: '12px' }}>
                      <h3 className="card-title" style={{ fontSize: '1rem' }}>
                        <Terminal size={16} color="var(--color-cyber)" />
                        Synapse Extraction Stream
                      </h3>
                      <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>Live Processing</span>
                    </div>
                    
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                      Real-time extraction pipeline listening to connected API channels.
                    </p>

                    <div className="live-stream-items">
                      {ingestionLogs.map((log) => {
                        let color = 'var(--color-primary)';
                        if (log.platform === 'Slack') color = 'var(--color-cyber)';
                        if (log.platform === 'Notion') color = 'var(--color-success)';
                        if (log.platform === 'Calendar') color = 'var(--color-warning)';
                        if (log.platform === 'Jira') color = 'var(--color-accent)';

                        return (
                          <div key={log.id} className="stream-item" style={{ borderLeftColor: color }}>
                            <div className="stream-item-header">
                              <span className="stream-item-tool" style={{ color }}>{log.platform}</span>
                              <span className="stream-item-time">{log.time}</span>
                            </div>
                            <p className="stream-item-title">{log.title}</p>
                            <p className="stream-item-action">{log.action}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* MINI QUICK INTEGRATIONS OVERVIEW */}
                  <div className="glass-panel" style={{ padding: '20px' }}>
                    <h3 className="card-title" style={{ fontSize: '1rem', marginBottom: '12px' }}>
                      Workspace Sync
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {Object.entries(integrations).map(([app, isConnected]) => (
                        <div key={app} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{app}</span>
                          <span style={{
                            color: isConnected ? 'var(--color-success)' : 'var(--text-muted)',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <span style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: isConnected ? 'var(--color-success)' : 'var(--text-muted)',
                              display: 'inline-block'
                            }} />
                            {isConnected ? 'Syncing' : 'Disconnected'}
                          </span>
                        </div>
                      ))}
                    </div>
                    <button className="btn btn-secondary" style={{ width: '100%', marginTop: '14px', padding: '6px', fontSize: '0.75rem' }} onClick={() => setActiveTab('integrations')}>
                      Manage Apps
                    </button>
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* ==========================================
              TAB 2: UNIFIED AI SEARCH
              ========================================== */}
          {activeTab === 'search' && (
            <div className="animate-slide-up search-view-container">
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                  Search Your Second Brain
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '4px', maxWidth: '600px', margin: '4px auto 0' }}>
                  Ask natural language questions. Synapse will semantically scan across all connected chats, emails, documentation pages, and databases to deliver a contextual answer.
                </p>
              </div>

              {/* SEARCH PROMPT FORM */}
              <form onSubmit={handleSearchSubmit}>
                <div className="search-input-wrapper">
                  <Brain size={24} color="var(--color-primary)" style={{ marginLeft: '12px' }} />
                  <input 
                    type="text"
                    className="search-input"
                    placeholder="Ask Synapse (e.g. 'What did the team decide about onboarding?')"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button type="submit" className="search-button">
                    {isSearching ? <RefreshCw className="animate-spin" size={20} /> : <ArrowRight size={20} />}
                  </button>
                </div>
              </form>

              {/* SUGGESTED PRE-BUILT QUERIES */}
              <div className="suggestions-row">
                <button className="suggestion-pill" onClick={() => triggerSuggestionSearch('What did the team decide about onboarding?')}>
                  "What did the team decide about onboarding?"
                </button>
                <button className="suggestion-pill" onClick={() => triggerSuggestionSearch('What are the current project blockers?')}>
                  "What are the current project blockers?"
                </button>
                <button className="suggestion-pill" onClick={() => triggerSuggestionSearch('Summarize user experience feedback.')}>
                  "Summarize user experience feedback"
                </button>
              </div>

              {/* SEARCH RESULTS DISPLAY */}
              <div className="search-result-box">
                {isSearching ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div className="logo-icon-container" style={{ margin: '0 auto 16px', width: '50px', height: '50px' }}>
                      <Brain size={26} className="animate-pulse" />
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>
                      Consulting Cortex Neural Index...
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '6px' }}>
                      Scanning vector embeddings & graph relations across Slack, Gmail, & Notion
                    </p>
                  </div>
                ) : searchAnswer ? (
                  <div className="results-scrollable">
                    {/* Core AI Answer Card */}
                    <div className="glass-panel ai-answer-card animate-fade-in" style={{ borderLeft: '3px solid var(--color-cyber)' }}>
                      <div className="ai-answer-header">
                        <Brain size={18} />
                        Synapse Cortex Answer
                        {searchConfidence && (
                          <span className="badge badge-success" style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>
                            {searchConfidence}% Semantic Confidence
                          </span>
                        )}
                      </div>

                      {/* Main contextual response */}
                      <p className="ai-answer-text" dangerouslySetInnerHTML={{ __html: searchAnswer.replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--color-cyber)">$1</strong>') }} />

                      {/* Actionable items derived */}
                      {searchRelatedTasks.length > 0 && (
                        <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px', marginTop: '16px' }}>
                          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '10px' }}>
                            Action Items Mentioned
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {searchRelatedTasks.map((tName, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-accent)' }}></div>
                                <span>{tName}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Sources (Citations) Cards */}
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>
                        Source Documents & Conversations
                      </h3>
                      <div className="sources-grid">
                        {searchSources.map((src, idx) => {
                          let sColor = 'var(--color-primary)';
                          if (src.platform === 'Slack') sColor = 'var(--color-cyber)';
                          if (src.platform === 'Notion') sColor = 'var(--color-success)';
                          if (src.platform === 'Calendar') sColor = 'var(--color-warning)';
                          if (src.platform === 'Drive') sColor = '#34d399';
                          if (src.platform === 'Jira') sColor = '#a855f7';

                          return (
                            <div key={idx} className="source-card">
                              <div className="source-icon-wrapper" style={{ background: `rgba(255, 255, 255, 0.03)`, color: sColor }}>
                                <src.icon size={16} />
                              </div>
                              <div className="source-info">
                                <span className="source-title">{src.title}</span>
                                <span className="source-platform" style={{ color: sColor }}>{src.platform}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Search size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                    <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>Enter a query above to search your unified workspace memory.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==========================================
              TAB 3: AUTO TASK EXTRACTION
              ========================================== */}
          {activeTab === 'tasks' && (
            <div className="animate-slide-up task-extraction-container">
              
              {/* LEFT COLUMN: ACTIVE CHATS FEED */}
              <div className="feed-column">
                <div className="column-header">
                  <h3 className="column-title">Communication Threads</h3>
                  <span className="badge badge-indigo">Auto Scanning</span>
                </div>

                <div className="column-scrollable">
                  {conversations.map((convo) => {
                    const isSelected = activeConvo.id === convo.id;
                    const cColor = convo.platform === 'Slack' ? 'var(--color-cyber)' : 'var(--color-primary)';

                    return (
                      <div 
                        key={convo.id} 
                        className={`glass-panel convo-card ${isSelected ? 'active' : ''}`}
                        onClick={() => setActiveConvo(convo)}
                      >
                        <div className="convo-card-header">
                          <span className="convo-sender">{convo.sender}</span>
                          <span className="badge" style={{
                            background: convo.platform === 'Slack' ? 'rgba(6, 182, 212, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                            color: cColor,
                            fontSize: '0.65rem'
                          }}>
                            {convo.platform}
                          </span>
                        </div>

                        <p className="convo-text" style={{
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          marginBottom: '8px'
                        }}>
                          {convo.text}
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '4px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>{convo.time}</span>
                          {convo.extracted ? (
                            <span style={{ color: 'var(--color-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Check size={12} /> Sync Complete
                            </span>
                          ) : (
                            <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>
                              {convo.tasks.length} Draft Tasks Found
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT COLUMN: AI EXTRACTOR DETAIL & ACTION PANELS */}
              <div className="extracted-column">
                <div className="column-header">
                  <h3 className="column-title">AI Extraction Workspace</h3>
                  <span className="badge badge-cyan">Handled by Cortex</span>
                </div>

                {activeConvo ? (
                  <div className="glass-panel" style={{ padding: '24px', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* Conversation text view */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Original Transmitted Text</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{activeConvo.time}</span>
                      </div>
                      
                      <div style={{
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '12px',
                        padding: '16px',
                        fontSize: '0.9rem',
                        lineHeight: 1.5,
                        color: '#e2e8f0'
                      }}>
                        {/* Highlight key words */}
                        <p dangerouslySetInnerHTML={{
                          __html: activeConvo.text
                            .replace(/(Auth Token Refresh bug|API onboarding guide|Slides for Onboarding|Analyze User Feedback V2 document)/gi, '<mark style="background: rgba(168, 85, 247, 0.25); color: #c084fc; padding: 1px 4px; border-radius: 4px;">$1</mark>')
                            .replace(/(Alex Rivera|Sarah Lin|Jessica Chen|Jessica)/gi, '<strong style="color: var(--color-cyber)">$1</strong>')
                        }} />
                      </div>
                    </div>

                    {/* AI Draft Tasks Area */}
                    <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                          Proactively Discovered Tasks
                        </h4>
                        {activeConvo.extracted ? (
                          <span className="badge badge-success">Synced to Graph</span>
                        ) : (
                          <button 
                            className="btn btn-primary"
                            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                            onClick={() => extractTasksFromConvo(activeConvo.id)}
                          >
                            <Brain size={14} /> Synapse to Task Board
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexGrow: 1, overflowY: 'auto' }}>
                        {activeConvo.tasks.map((task, idx) => (
                          <div key={idx} className="glass-panel extracted-task-card">
                            <div className="task-card-header">
                              <span className="task-title">{task.title}</span>
                              <span className={`badge ${
                                task.priority === 'High' ? 'badge-indigo' : 'badge-cyan'
                              }`} style={{ fontSize: '0.65rem' }}>
                                {task.priority} Priority
                              </span>
                            </div>

                            <div className="task-meta-row">
                              <div className="task-meta-item">
                                <User size={12} />
                                <span>Assignee: {task.assignee}</span>
                              </div>
                              <div className="task-meta-item">
                                <Calendar size={12} />
                                <span>Due Date: {task.dueDate}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Centralised Active Task Board Preview */}
                    <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Active Synced Task Board</h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {tasks.length} total synced tasks
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                        {tasks.map(t => (
                          <div key={t.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'rgba(255, 255, 255, 0.01)',
                            border: '1px solid rgba(255, 255, 255, 0.04)',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            fontSize: '0.8rem'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <button 
                                onClick={() => toggleTaskStatus(t.id)}
                                style={{
                                  width: '18px',
                                  height: '18px',
                                  borderRadius: '4px',
                                  border: '1px solid rgba(255, 255, 255, 0.2)',
                                  background: t.status === 'Completed' ? 'var(--color-success)' : 'transparent',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#fff'
                                }}
                              >
                                {t.status === 'Completed' && <Check size={12} />}
                              </button>
                              <span style={{
                                textDecoration: t.status === 'Completed' ? 'line-through' : 'none',
                                color: t.status === 'Completed' ? 'var(--text-muted)' : '#f8fafc',
                                fontWeight: 500
                              }}>
                                {t.title}
                              </span>
                            </div>
                            <span className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>{t.platform}</span>
                          </div>
                        ))}
                      </div>

                      {/* Add task button quick mock */}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <input 
                          type="text" 
                          id="quick-task-input"
                          placeholder="Quick add personal task..."
                          style={{
                            flexGrow: 1,
                            background: 'rgba(0,0,0,0.2)',
                            border: '1px solid var(--border-light)',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '0.75rem',
                            color: '#fff',
                            outline: 'none'
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const input = e.currentTarget;
                              if (input.value.trim()) {
                                handleAddTaskDirectly(input.value, 'Medium', 'Personal');
                                input.value = '';
                              }
                            }
                          }}
                        />
                        <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => {
                          const input = document.getElementById('quick-task-input') as HTMLInputElement;
                          if (input && input.value.trim()) {
                            handleAddTaskDirectly(input.value, 'Medium', 'Personal');
                            input.value = '';
                          }
                        }}>
                          <Plus size={12} /> Add
                        </button>
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <p>Select a thread on the left to extract tasks.</p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ==========================================
              TAB 4: KNOWLEDGE GRAPH ENGINE
              ========================================== */}
          {activeTab === 'graph' && (
            <div className="animate-slide-up graph-container">
              
              {/* MAIN CANVAS GRAPH PORT */}
              <div className="graph-viewport-card glass-panel">
                
                {/* CANVAS AREA */}
                <canvas 
                  ref={canvasRef}
                  className="graph-canvas"
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                />

                {/* GRAPH CONTROLS (ZOOM/RESET) */}
                <div className="graph-controls">
                  <button className="graph-control-btn" title="Zoom In" onClick={() => triggerToast('Zoom feature simulated.')}>+</button>
                  <button className="graph-control-btn" title="Zoom Out" onClick={() => triggerToast('Zoom feature simulated.')}>-</button>
                  <button className="graph-control-btn" title="Reset View Layout" onClick={() => {
                    // Randomise layout slightly
                    setGraphNodes(prev => prev.map(n => ({
                      ...n,
                      x: 200 + Math.random() * 300,
                      y: 150 + Math.random() * 200,
                      vx: 0,
                      vy: 0
                    })));
                    triggerToast('Graph gravity distribution recalculated.');
                  }}>
                    <RefreshCw size={14} />
                  </button>
                </div>

                {/* SEARCH GRAPH BAR */}
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  display: 'flex',
                  gap: '8px',
                  zIndex: 10,
                  maxWidth: '240px',
                  width: '100%'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'rgba(10, 11, 18, 0.9)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    width: '100%'
                  }}>
                    <Search size={14} color="var(--text-muted)" style={{ marginRight: '6px' }} />
                    <input 
                      type="text" 
                      placeholder="Search entities..." 
                      value={graphSearchQuery}
                      onChange={(e) => setGraphSearchQuery(e.target.value)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        fontSize: '0.75rem',
                        color: '#fff',
                        width: '100%'
                      }}
                    />
                    {graphSearchQuery && (
                      <X size={12} color="var(--text-muted)" style={{ cursor: 'pointer' }} onClick={() => setGraphSearchQuery('')} />
                    )}
                  </div>
                </div>

                {/* CATEGORY FILTERS OVERLAY */}
                <div className="graph-filters-overlay">
                  <div 
                    className={`graph-filter-pill ${nodeCategoryFilter === 'all' ? 'active' : ''}`}
                    style={{ '--bg-fill': 'rgba(255,255,255,0.1)', '--border-color': 'rgba(255,255,255,0.3)', '--text-color': '#fff' } as React.CSSProperties}
                    onClick={() => setNodeCategoryFilter('all')}
                  >
                    All
                  </div>
                  <div 
                    className={`graph-filter-pill ${nodeCategoryFilter === 'person' ? 'active' : ''}`}
                    style={{ '--bg-fill': 'rgba(6, 182, 212, 0.12)', '--border-color': 'rgba(6, 182, 212, 0.4)', '--text-color': '#22d3ee' } as React.CSSProperties}
                    onClick={() => setNodeCategoryFilter('person')}
                  >
                    <span className="graph-legend-dot" style={{ '--dot-color': '#06b6d4' } as React.CSSProperties}></span>
                    People
                  </div>
                  <div 
                    className={`graph-filter-pill ${nodeCategoryFilter === 'document' ? 'active' : ''}`}
                    style={{ '--bg-fill': 'rgba(16, 185, 129, 0.1)', '--border-color': 'rgba(16, 185, 129, 0.4)', '--text-color': '#34d399' } as React.CSSProperties}
                    onClick={() => setNodeCategoryFilter('document')}
                  >
                    <span className="graph-legend-dot" style={{ '--dot-color': '#10b981' } as React.CSSProperties}></span>
                    Docs
                  </div>
                  <div 
                    className={`graph-filter-pill ${nodeCategoryFilter === 'meeting' ? 'active' : ''}`}
                    style={{ '--bg-fill': 'rgba(245, 158, 11, 0.1)', '--border-color': 'rgba(245, 158, 11, 0.4)', '--text-color': '#fbbf24' } as React.CSSProperties}
                    onClick={() => setNodeCategoryFilter('meeting')}
                  >
                    <span className="graph-legend-dot" style={{ '--dot-color': '#f59e0b' } as React.CSSProperties}></span>
                    Meetings
                  </div>
                  <div 
                    className={`graph-filter-pill ${nodeCategoryFilter === 'task' ? 'active' : ''}`}
                    style={{ '--bg-fill': 'rgba(168, 85, 247, 0.1)', '--border-color': 'rgba(168, 85, 247, 0.4)', '--text-color': '#c084fc' } as React.CSSProperties}
                    onClick={() => setNodeCategoryFilter('task')}
                  >
                    <span className="graph-legend-dot" style={{ '--dot-color': '#a855f7' } as React.CSSProperties}></span>
                    Tasks
                  </div>
                </div>

              </div>

              {/* DETAILED SELECTED NODE SIDEBAR */}
              <div className="graph-details-sidebar glass-panel">
                <div className="details-header">
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Info size={16} color="var(--color-primary)" />
                    Entity Context Explorer
                  </h3>
                  {selectedNode && (
                    <span className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>Active Node</span>
                  )}
                </div>

                {selectedNode ? (
                  <div className="details-content">
                    <div className="node-profile">
                      {/* Node Icon Box */}
                      <div className="node-icon-large" style={{
                        background: 
                          selectedNode.type === 'person' ? 'rgba(6, 182, 212, 0.12)' :
                          selectedNode.type === 'document' ? 'rgba(16, 185, 129, 0.1)' :
                          selectedNode.type === 'meeting' ? 'rgba(245, 158, 11, 0.1)' :
                          selectedNode.type === 'task' ? 'rgba(168, 85, 247, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                        color:
                          selectedNode.type === 'person' ? '#06b6d4' :
                          selectedNode.type === 'document' ? '#10b981' :
                          selectedNode.type === 'meeting' ? '#f59e0b' :
                          selectedNode.type === 'task' ? '#a855f7' : '#f43f5e',
                        border: '1px solid rgba(255, 255, 255, 0.08)'
                      }}>
                        {selectedNode.type === 'person' && <Users size={28} />}
                        {selectedNode.type === 'document' && <FileText size={28} />}
                        {selectedNode.type === 'meeting' && <Calendar size={28} />}
                        {selectedNode.type === 'task' && <CheckSquare size={28} />}
                        {selectedNode.type === 'project' && <Briefcase size={28} />}
                      </div>

                      <h4 className="node-title-large">{selectedNode.label}</h4>
                      
                      <span className="node-type-badge" style={{
                        color:
                          selectedNode.type === 'person' ? '#22d3ee' :
                          selectedNode.type === 'document' ? '#34d399' :
                          selectedNode.type === 'meeting' ? '#fbbf24' :
                          selectedNode.type === 'task' ? '#c084fc' : '#f43f5e'
                      }}>
                        {selectedNode.type}
                      </span>
                    </div>

                    {/* Metadata fields */}
                    <div className="node-meta-box">
                      {selectedNode.type === 'person' && (
                        <>
                          <div className="meta-field">
                            <span className="meta-label">Role</span>
                            <span className="meta-value">{selectedNode.role}</span>
                          </div>
                          <div className="meta-field">
                            <span className="meta-label">Teams</span>
                            <span className="meta-value">Engineering, Product</span>
                          </div>
                        </>
                      )}

                      {selectedNode.type === 'document' && (
                        <>
                          <div className="meta-field">
                            <span className="meta-label">Workspace</span>
                            <span className="meta-value">{selectedNode.platform}</span>
                          </div>
                          {selectedNode.url && (
                            <div className="meta-field" style={{ alignItems: 'center' }}>
                              <span className="meta-label">Access URI</span>
                              <a 
                                href={selectedNode.url} 
                                target="_blank" 
                                rel="noreferrer" 
                                style={{ color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '2px', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 600 }}
                              >
                                Open File <ExternalLink size={10} />
                              </a>
                            </div>
                          )}
                        </>
                      )}

                      {selectedNode.type === 'meeting' && (
                        <>
                          <div className="meta-field">
                            <span className="meta-label">Organizer</span>
                            <span className="meta-value">Sarah Lin</span>
                          </div>
                          <div className="meta-field">
                            <span className="meta-label">Event Date</span>
                            <span className="meta-value">{selectedNode.date}</span>
                          </div>
                        </>
                      )}

                      {selectedNode.type === 'task' && (
                        <>
                          <div className="meta-field">
                            <span className="meta-label">Priority</span>
                            <span className="meta-value">{selectedNode.priority}</span>
                          </div>
                          <div className="meta-field">
                            <span className="meta-label">Platform</span>
                            <span className="meta-value">{selectedNode.platform}</span>
                          </div>
                        </>
                      )}

                      {selectedNode.type === 'project' && (
                        <>
                          <div className="meta-field">
                            <span className="meta-label">Status</span>
                            <span className="meta-value" style={{ color: 'var(--color-success)', fontWeight: 600 }}>Active Rollout</span>
                          </div>
                          <div className="meta-field">
                            <span className="meta-label">Milestones</span>
                            <span className="meta-value">Beta Release, Security Audit</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Node Relations Checklist */}
                    <div>
                      <h4 className="connections-section-title">Connected Relationships</h4>
                      <div className="related-nodes-list">
                        {graphLinks
                          .filter(link => link.source === selectedNode.id || link.target === selectedNode.id)
                          .map((link, i) => {
                            const isSource = link.source === selectedNode.id;
                            const oppositeId = isSource ? link.target : link.source;
                            const oppositeNode = graphNodes.find(n => n.id === oppositeId);

                            if (!oppositeNode) return null;

                            return (
                              <div 
                                key={i} 
                                className="related-node-item"
                                onClick={() => setSelectedNode(oppositeNode)}
                              >
                                <div className="related-node-info">
                                  <span style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    background: 
                                      oppositeNode.type === 'person' ? '#06b6d4' :
                                      oppositeNode.type === 'document' ? '#10b981' :
                                      oppositeNode.type === 'meeting' ? '#f59e0b' :
                                      oppositeNode.type === 'task' ? '#a855f7' : '#f43f5e'
                                  }}></span>
                                  <span className="related-node-title">{oppositeNode.label}</span>
                                </div>
                                <span className="related-node-relation">
                                  {isSource ? link.relation : `related (${link.relation})`}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <p>Click any node in the knowledge graph to trace contextual relationships, access source links, and view metadata.</p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ==========================================
              TAB 5: INTEGRATION APP HUB
              ========================================== */}
          {activeTab === 'integrations' && (
            <div className="animate-slide-up">
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                  Workplace Tool Integrations
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '4px' }}>
                  Synapse sits as an intelligence layer above your existing tools. Connect your corporate tools securely via OAuth 2.0. All messages, calendar schedules, and document updates are compiled locally and vectorized.
                </p>
              </div>

              {/* SIMULATED CONNECT HANDSHAKE OVERLAY */}
              {isConnectingJira && (
                <div className="glass-panel" style={{
                  padding: '32px',
                  marginBottom: '24px',
                  border: '1px solid var(--color-primary)',
                  boxShadow: '0 0 30px rgba(99, 102, 241, 0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center'
                }}>
                  <div className="logo-icon-container animate-bounce" style={{ width: '56px', height: '56px', marginBottom: '16px' }}>
                    <RefreshCw className="animate-spin" size={24} color="#fff" />
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: '8px' }}>
                    Establishing Proactive Synchronization
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '500px', marginBottom: '16px' }}>
                    Securing safe tunnels with corporate platform APIs, downloading metadata, extracting entities, and executing vector semantic mapping.
                  </p>
                  <p style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    color: 'var(--color-cyber)',
                    background: 'rgba(0,0,0,0.3)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    {jiraConnectionStep}
                  </p>
                </div>
              )}

              {/* MAIN INTEGRATIONS LIST */}
              <div className="integrations-grid">
                
                {/* 1. Gmail */}
                <div className="glass-panel integration-card glow-indigo">
                  <div className="integration-card-top">
                    <div className="integration-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444' }}>
                      <Mail size={24} />
                    </div>
                    <span className="badge badge-success">Connected</span>
                  </div>
                  <div className="integration-card-body">
                    <h3 className="integration-card-title">Gmail</h3>
                    <p className="integration-card-desc">
                      Syncs email threads, summarizes messages, and highlights requested client and developer deliverables.
                    </p>
                  </div>
                  <div className="integration-card-bottom">
                    <div className="integration-stats">
                      <span>Index Count: <span className="integration-stats-value">142 Emails</span></span>
                      <span>Last Ingested: <span style={{ color: 'var(--text-primary)' }}>2 mins ago</span></span>
                    </div>
                    <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} disabled>
                      Configured
                    </button>
                  </div>
                </div>

                {/* 2. Slack */}
                <div className="glass-panel integration-card glow-cyan">
                  <div className="integration-card-top">
                    <div className="integration-icon-wrapper" style={{ background: 'rgba(6, 182, 212, 0.08)', color: '#06b6d4' }}>
                      <MessageSquare size={24} />
                    </div>
                    <span className="badge badge-success">Connected</span>
                  </div>
                  <div className="integration-card-body">
                    <h3 className="integration-card-title">Slack Channels</h3>
                    <p className="integration-card-desc">
                      Extracts actionables, tracks conversational flow, and identifies project blockers mentioned in chat streams.
                    </p>
                  </div>
                  <div className="integration-card-bottom">
                    <div className="integration-stats">
                      <span>Index Count: <span className="integration-stats-value">1,245 Messages</span></span>
                      <span>Last Ingested: <span style={{ color: 'var(--text-primary)' }}>1 min ago</span></span>
                    </div>
                    <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} disabled>
                      Configured
                    </button>
                  </div>
                </div>

                {/* 3. Notion */}
                <div className="glass-panel integration-card glow-violet">
                  <div className="integration-card-top">
                    <div className="integration-icon-wrapper" style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#fff' }}>
                      <FileText size={24} />
                    </div>
                    <span className="badge badge-success">Connected</span>
                  </div>
                  <div className="integration-card-body">
                    <h3 className="integration-card-title">Notion Workspaces</h3>
                    <p className="integration-card-desc">
                      Syncs product specifications, engineering roadmaps, and documents, mapping them to contextual nodes.
                    </p>
                  </div>
                  <div className="integration-card-bottom">
                    <div className="integration-stats">
                      <span>Index Count: <span className="integration-stats-value">42 Wiki Pages</span></span>
                      <span>Last Ingested: <span style={{ color: 'var(--text-primary)' }}>5 mins ago</span></span>
                    </div>
                    <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} disabled>
                      Configured
                    </button>
                  </div>
                </div>

                {/* 4. Google Drive */}
                <div className="glass-panel integration-card glow-indigo">
                  <div className="integration-card-top">
                    <div className="integration-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10b981' }}>
                      <HardDrive size={24} />
                    </div>
                    <span className="badge badge-success">Connected</span>
                  </div>
                  <div className="integration-card-body">
                    <h3 className="integration-card-title">Google Drive</h3>
                    <p className="integration-card-desc">
                      Processes PDF reports, sheet documents, and spec slides to automatically build contextual cross-references.
                    </p>
                  </div>
                  <div className="integration-card-bottom">
                    <div className="integration-stats">
                      <span>Index Count: <span className="integration-stats-value">18 Documents</span></span>
                      <span>Last Ingested: <span style={{ color: 'var(--text-primary)' }}>10 mins ago</span></span>
                    </div>
                    <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} disabled>
                      Configured
                    </button>
                  </div>
                </div>

                {/* 5. Google Calendar */}
                <div className="glass-panel integration-card glow-cyan">
                  <div className="integration-card-top">
                    <div className="integration-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b' }}>
                      <Calendar size={24} />
                    </div>
                    <span className="badge badge-success">Connected</span>
                  </div>
                  <div className="integration-card-body">
                    <h3 className="integration-card-title">Google Calendar</h3>
                    <p className="integration-card-desc">
                      Imports invite structures and summaries, linking meetings contextually to related files and developers.
                    </p>
                  </div>
                  <div className="integration-card-bottom">
                    <div className="integration-stats">
                      <span>Index Count: <span className="integration-stats-value">12 Meetings</span></span>
                      <span>Last Ingested: <span style={{ color: 'var(--text-primary)' }}>3 mins ago</span></span>
                    </div>
                    <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} disabled>
                      Configured
                    </button>
                  </div>
                </div>

                {/* 6. Jira Cloud */}
                <div className={`glass-panel integration-card ${integrations.jira ? 'glow-violet' : ''}`} style={{
                  border: !integrations.jira ? '1px dashed rgba(255,255,255,0.15)' : '1px solid var(--border-light)'
                }}>
                  <div className="integration-card-top">
                    <div className="integration-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6' }}>
                      <CheckSquare size={24} />
                    </div>
                    {integrations.jira ? (
                      <span className="badge badge-success">Connected</span>
                    ) : (
                      <span className="badge badge-warning">Available</span>
                    )}
                  </div>
                  <div className="integration-card-body">
                    <h3 className="integration-card-title">Jira Software</h3>
                    <p className="integration-card-desc">
                      Syncs agile task boards, assigns deliverables to developers, and registers project milestones dynamically.
                    </p>
                  </div>
                  <div className="integration-card-bottom">
                    <div className="integration-stats">
                      <span>Index Count: <span className="integration-stats-value">{integrations.jira ? '2 Active Tasks' : '0 Tasks'}</span></span>
                      <span>Last Ingested: <span style={{ color: 'var(--text-primary)' }}>{integrations.jira ? 'Just now' : 'Never'}</span></span>
                    </div>
                    <button 
                      className={`btn ${integrations.jira ? 'btn-secondary' : 'btn-cyber'}`}
                      style={{ padding: '6px 14px', fontSize: '0.75rem' }}
                      onClick={connectJira}
                      disabled={isConnectingJira}
                    >
                      {integrations.jira ? 'Disconnect' : 'Connect'}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default App;
