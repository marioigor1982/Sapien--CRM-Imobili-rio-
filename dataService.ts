
import { db } from "./firebase";
import { 
  collection, addDoc, getDocs, updateDoc, 
  deleteDoc, doc, onSnapshot, query, serverTimestamp,
  orderBy, Timestamp 
} from "firebase/firestore";

// Generic Factory for Firestore Services with real-time sync
const createService = (collectionName: string) => {
  const ref = collection(db, collectionName);

  return {
    create: async (data: any) => {
      // Clean data: remove id and ensure numbers are numbers
      const { id, ...cleanData } = data;
      const dataToSave = {
        ...cleanData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      return await addDoc(ref, dataToSave);
    },
    list: async () => {
      const snap = await getDocs(ref);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },
    update: async (id: string, data: any) => {
      const docRef = doc(db, collectionName, id);
      const { id: _, ...cleanData } = data;
      return await updateDoc(docRef, {
        ...cleanData,
        updatedAt: serverTimestamp()
      });
    },
    remove: async (id: string) => {
      return await deleteDoc(doc(db, collectionName, id));
    },
    subscribe: (callback: (data: any[]) => void) => {
      // Using query to sort by created time if needed
      const q = query(ref); 
      return onSnapshot(q, (snap) => {
        const data = snap.docs.map(d => {
          const docData = d.data();
          return { 
            id: d.id, 
            ...docData,
            // Convert Firestore Timestamps to ISO strings for internal state consistency if needed
            createdAt: docData.createdAt instanceof Timestamp ? docData.createdAt.toDate().toISOString() : docData.createdAt
          };
        });
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
