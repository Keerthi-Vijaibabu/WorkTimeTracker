
import { type VerifyWorkingOutput } from "@/ai/flows/verify-working-flow";
import { db, auth } from './firebase';
import { collection, addDoc, getDocs, query, where, serverTimestamp, doc, updateDoc, Timestamp, orderBy, onSnapshot, getDoc, setDoc, collectionGroup } from 'firebase/firestore';

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
    id: string; // This will now be the Firebase Auth UID
    email: string;
    name: string;
    role: 'admin' | 'worker';
}

export const seedData = async () => {
    // This function can be expanded to seed projects, etc.
    console.log('Seeding data if needed...');
};

export const getUsers = async (): Promise<User[]> => {
    const usersCol = collection(db, 'users');
    const userSnapshot = await getDocs(usersCol);
    return userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
};

export const updateUserRole = async (userId: string, role: 'admin' | 'worker') => {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { role });
};


export const isAdmin = async (uid: string | undefined): Promise<boolean> => {
    if (!uid) return false;
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
       return false;
    }
    
    const user = userSnap.data() as Omit<User, 'id'>;
    return user.role === 'admin';
};

export const createUserDocument = async (uid: string, email: string) => {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
        const isKeerthi = email.toLowerCase() === 'keerthi.vijaibabu@gmail.com';
        await setDoc(userRef, {
            email: email,
            name: email.split('@')[0],
            role: isKeerthi ? 'admin' : 'worker'
        });
    }
}


// --- Firestore Functions ---

// Projects
export const getProjects = async (): Promise<Project[]> => {
    const projectsCol = collection(db, 'projects');
    const projectSnapshot = await getDocs(projectsCol);
    const projectList = projectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
    return projectList;
};
export const getProjectById = async (id: string): Promise<Project | null> => {
    const docRef = doc(db, 'projects', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Project : null;
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
}

// User Sessions
export const getUserSessions = (callback: (sessions: UserSession[]) => void, uid?: string) => {
    let sessionsQuery;
    if (uid) {
        // Get sessions for a specific user
        sessionsQuery = query(collection(db, 'users', uid, 'sessions'), orderBy('stopTime', 'desc'));
    } else {
        // Get all sessions for admin view using a collection group query
        sessionsQuery = query(collectionGroup(db, 'sessions'), orderBy('stopTime', 'desc'));
    }
    
    return onSnapshot(sessionsQuery, (querySnapshot) => {
        const sessions: UserSession[] = [];
        querySnapshot.forEach((doc) => {
            sessions.push({ id: doc.id, ...doc.data() } as UserSession);
        });
        callback(sessions);
    });
};

export const addUserSession = async (uid: string, session: Omit<UserSession, 'id'>) => {
    if (!uid) throw new Error("User not authenticated");
    await addDoc(collection(db, "users", uid, "sessions"), session);
};

// Verification Log
export const getVerificationLog = (callback: (logs: VerificationLogEntry[]) => void) => {
    const logCol = collectionGroup(db, 'verificationLog');
    const q = query(logCol, orderBy('timestamp', 'desc'));
    
    return onSnapshot(q, (querySnapshot) => {
        const logs: VerificationLogEntry[] = [];
        querySnapshot.forEach((doc) => {
            logs.push({ id: doc.id, ...doc.data() } as VerificationLogEntry);
        });
        callback(logs);
    });
};

export const addVerificationLog = async (uid: string, log: Omit<VerificationLogEntry, 'id'>) => {
    if (!uid) throw new Error("User not authenticated");
    await addDoc(collection(db, "users", uid, "verificationLog"), log);
}
