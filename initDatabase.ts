
import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";

export const initDatabase = async () => {
  try {
    // Inicializa Clientes
    await addDoc(collection(db, "clientes"), {
      name: "Cliente Exemplo",
      taxId: "000.000.000-00",
      phone: "(00) 00000-0000",
      email: "exemplo@sapien.com",
      income: 5000,
      status: "Ativo"
    });

    // Inicializa Corretores
    await addDoc(collection(db, "corretores"), {
      name: "Corretor Exemplo",
      creci: "00000-F",
      phone: "(00) 00000-0000",
      email: "corretor@sapien.com",
      commissionRate: 1.5
    });

    // Inicializa Imóveis
    await addDoc(collection(db, "imoveis"), {
      title: "Imóvel Exemplo",
      type: "Apartamento",
      value: 350000,
      address: "Rua Exemplo, 123",
      photos: []
    });

    // Inicializa Bancos
    await addDoc(collection(db, "bancos"), {
      name: "Banco Exemplo",
      agency: "0001",
      phone: "(00) 0000-0000",
      email: "banco@exemplo.com",
      avgRate: 9.5
    });

    // Inicializa Construtoras
    await addDoc(collection(db, "construtoras"), {
      name: "Construtora Exemplo",
      cnpj: "00.000.000/0001-00",
      city: "Goiânia",
      state: "GO",
      phone: "(00) 0000-0000"
    });

    alert("🔥 Base de dados inicializada com sucesso!");
  } catch (error: any) {
    console.error("Erro ao inicializar base:", error);
    alert("Erro ao inicializar base: " + error.message);
  }
};
