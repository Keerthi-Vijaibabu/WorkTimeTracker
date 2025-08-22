
import { type VerifyWorkingOutput } from "@/ai/flows/verify-working-flow";
import { db } from './firebase';
import { collection, addDoc, getDocs, query, where, serverTimestamp, doc, updateDoc, Timestamp, orderBy, onSnapshot } from 'firebase/firestore';

// Data types
export type Session = {
  startTime: Date;
  stopTime: Date;
  duration: number;
};

export type UserSession = {
    id?: string;
    startTime: Timestamp; 
    stopTime: Timestamp; 
    duration: number;
    userEmail: string | null;
    project: string;
}

export type VerificationLogEntry = { 
    id?: string;
    photoDataUri: string;
    result: VerifyWorkingOutput;
    timestamp: Timestamp;
    userEmail: string;
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

// In-memory data for users, can be moved to Firestore if needed
let users: User[] = [
    { id: '1', name: 'Alice', email: 'alice@example.com' },
    { id: '2', name: 'Bob', email: 'bob@example.com' },
    { id: '3', name: 'keerthi.vijaibabu@gmail.com', email: 'keerthi.vijaibabu@gmail.com' },
];
export const getUsers = () => users;


// --- Firestore Functions ---

// Projects
export const getProjects = async (): Promise<Project[]> => {
    const projectsCol = collection(db, 'projects');
    const projectSnapshot = await getDocs(projectsCol);
    const projectList = projectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
    return projectList;
};
export const getProjectById = async (id: string): Promise<Project | null> => {
    const projects = await getProjects();
    return projects.find(p => p.id === id) || null;
}

export const addProject = async (project: Omit<Project, 'id'>) => {
    const docRef = await addDoc(collection(db, "projects"), project);
    return { id: docRef.id, ...project };
};

// Tasks
export const getTasks = async (): Promise<Task[]> => {
    const tasksCol = collection(db, 'tasks');
    const taskSnapshot = await getDocs(tasksCol);
    return taskSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
};

export const addTask = async (task: Omit<Task, 'id'>) => {
    const docRef = await addDoc(collection(db, "tasks"), task);
    return { id: docRef.id, ...task };
};

export const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    const taskRef = doc(db, "tasks", taskId);
    await updateDoc(taskRef, { status });
    const tasks = await getTasks();
    return tasks.find(t => t.id === taskId) || null;
}

// User Sessions
export const getUserSessions = (callback: (sessions: UserSession[]) => void) => {
    const sessionsCol = collection(db, 'userSessions');
    const q = query(sessionsCol, orderBy('stopTime', 'desc'));

    return onSnapshot(q, (querySnapshot) => {
        const sessions: UserSession[] = [];
        querySnapshot.forEach((doc) => {
            sessions.push({ id: doc.id, ...doc.data() } as UserSession);
        });
        callback(sessions);
    });
};

export const addUserSession = async (session: Omit<UserSession, 'id'>) => {
    await addDoc(collection(db, "userSessions"), session);
};

// Verification Log
export const getVerificationLog = (callback: (logs: VerificationLogEntry[]) => void) => {
    const logCol = collection(db, 'verificationLog');
    const q = query(logCol, orderBy('timestamp', 'desc'));
    
    return onSnapshot(q, (querySnapshot) => {
        const logs: VerificationLogEntry[] = [];
        querySnapshot.forEach((doc) => {
            logs.push({ id: doc.id, ...doc.data() } as VerificationLogEntry);
        });
        callback(logs);
    });
};

export const addVerificationLog = async (log: Omit<VerificationLogEntry, 'id'>) => {
    await addDoc(collection(db, "verificationLog"), log);
}
