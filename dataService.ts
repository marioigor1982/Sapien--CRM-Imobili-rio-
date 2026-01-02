
import { db } from "./firebase";
import { 
  collection, addDoc, getDocs, updateDoc, 
  deleteDoc, doc, onSnapshot, query 
} from "firebase/firestore";

// Generic Factory for Firestore Services
const createService = (collectionName: string) => {
  const ref = collection(db, collectionName);

  return {
    create: async (data: any) => {
      const { id, ...rest } = data; // Remove client-side ID if it exists
      return await addDoc(ref, rest);
    },
    list: async () => {
      const snap = await getDocs(ref);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },
    update: async (id: string, data: any) => {
      const docRef = doc(db, collectionName, id);
      const { id: _, ...rest } = data;
      return await updateDoc(docRef, rest);
    },
    remove: async (id: string) => {
      return await deleteDoc(doc(db, collectionName, id));
    },
    subscribe: (callback: (data: any[]) => void) => {
      return onSnapshot(query(ref), (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(data);
      });
    }
  };
};

export const clientService = createService("clientes");
export const brokerService = createService("corretores");
export const propertyService = createService("imoveis");
export const bankService = createService("bancos");
export const companyService = createService("construtoras");
export const leadService = createService("leads");
