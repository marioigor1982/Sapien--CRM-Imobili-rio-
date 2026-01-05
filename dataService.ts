
import { db } from "./firebase";
import { 
  collection, addDoc, getDocs, setDoc, // Usando setDoc para robustez (upsert)
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
      // 1. Validar o ID: Verifique se a variável que contém o ID não está vazia.
      if (!id || typeof id !== 'string' || id.trim() === '') {
        console.error("Tentativa de atualização sem ID válido:", collectionName);
        throw new Error("ID do documento inválido ou vazio.");
      }

      const docRef = doc(db, collectionName, id);
      const { id: _, ...cleanData } = data;

      // 2. Tratar a inexistência e merge: Usando setDoc com { merge: true }
      try {
        return await setDoc(docRef, {
          ...cleanData,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (e) {
        console.error(`Erro ao salvar no Firestore (${collectionName}):`, e);
        throw e;
      }
    },
    remove: async (id: string) => {
      if (!id) return;
      return await deleteDoc(doc(db, collectionName, id));
    },
    subscribe: (callback: (data: any[]) => void) => {
      const q = query(ref); 
      return onSnapshot(q, (snap) => {
        const data = snap.docs.map(d => {
          const docData = d.data();
          return { 
            id: d.id, 
            ...docData,
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
