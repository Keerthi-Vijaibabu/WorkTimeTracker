
import { type VerifyWorkingOutput } from "@/ai/flows/verify-working-flow";

// Data types
export type Session = {
  startTime: Date;
  stopTime: Date;
  duration: number;
};

export type UserSession = Session & {
    userEmail: string | null;
    project: string;
}

export type VerificationLogEntry = { 
    photoDataUri: string;
    result: VerifyWorkingOutput;
    timestamp: Date;
};

export type Project = {
    id: string;
    name: string;
    client: string;
};

export type Task = {
    id: string;
    projectId: string;
    assignedTo: string; // user email
    description: string;
    status: 'todo' | 'inprogress' | 'done';
}

export type User = {
    id: string;
    email: string;
    name: string;
}

// In-memory data stores
let projects: Project[] = [
    { id: "1", name: "Website Redesign", client: "Innovate Inc." },
    { id: "2", name: "Mobile App Dev", client: "TechCorp" },
    { id: "3", name: "API Integration", client: "Innovate Inc." },
    { id: "4", name: "Marketing Campaign", client: "Growth Co." },
];
let tasks: Task[] = [
    { id: '1', projectId: '1', assignedTo: 'keerthi.vijaibabu@gmail.com', description: 'Design homepage mockup', status: 'todo' },
    { id: '2', projectId: '2', assignedTo: 'keerthi.vijaibabu@gmail.com', description: 'Implement push notifications', status: 'todo' },
    { id: '3', projectId: '1', assignedTo: 'bob@example.com', description: 'Update color scheme', status: 'todo' },
];
let allUserSessions: UserSession[] = [];
let verificationLog: VerificationLogEntry[] = [];
let users: User[] = [
    { id: '1', name: 'Alice', email: 'alice@example.com' },
    { id: '2', name: 'Bob', email: 'bob@example.com' },
    { id: '3', name: 'keerthi.vijaibabu@gmail.com', email: 'keerthi.vijaibabu@gmail.com' },
]

// Functions to interact with data stores

// Projects
export const getProjects = () => projects;
export const getProjectById = (id: string) => projects.find(p => p.id === id);
export const addProject = (project: Omit<Project, 'id'>) => {
    const newProject = { ...project, id: String(projects.length + 1) };
    projects.push(newProject);
    return newProject;
};

// Tasks
export const getTasks = () => tasks;
export const addTask = (task: Omit<Task, 'id'>) => {
    const newTask = { ...task, id: String(tasks.length + 1) };
    tasks.push(newTask);
    return newTask;
};
export const updateTaskStatus = (taskId: string, status: Task['status']) => {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex > -1) {
        tasks[taskIndex].status = status;
        return tasks[taskIndex];
    }
    return null;
}

// Users
export const getUsers = () => users;


// User Sessions
export const getUserSessions = () => allUserSessions;
export const addUserSession = (session: UserSession) => {
    allUserSessions.unshift(session);
};

// Verification Log
export const getVerificationLog = () => verificationLog;
export const addVerificationLog = (log: VerificationLogEntry) => {
    verificationLog.unshift(log);
}
