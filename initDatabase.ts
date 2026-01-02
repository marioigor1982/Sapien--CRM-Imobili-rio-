
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
      title: "Mansão Suspensa Horizonte",
      type: "Apartamento",
      value: 1250000,
      address: "Av. Atlântica, 1000",
      neighborhood: "Copacabana",
      city: "Rio de Janeiro",
      state: "RJ",
      photos: [
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800"
      ]
    });

    // Inicializa Bancos
    await addDoc(collection(db, "bancos"), {
      name: "Caixa Econômica Federal",
      agency: "0001",
      phone: "(11) 4004-0001",
      email: "atendimento@caixa.gov.br",
      logo: "https://images.seeklogo.com/logo-png/2/1/caixa-economica-federal-logo-png_seeklogo-24768.png"
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
