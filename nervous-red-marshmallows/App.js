import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { encode } from 'base-64'; 


const IMAGGA_API = {
  key: 'acc_a98ad914cea7701', 
  secret: '45617f3daca1b07c5711262f4d8c8732', 
};

// --- Ícones Simples (Emojis) ---
const binIcons = {
  papel: '📰',
  plastico: '🧴',
  vidro: '🍾',
  metal: '🥫',
  organico: '🍎',
  eletronico: '🔋',
  perigoso: '☣️',
  nao_reciclavel: '🗑️',
  desconhecido: '❓',
};

// --- Dados dos Resíduos ---
export const wasteData = {
  // --- Plásticos ---
  'garrafa pet': {
    type: 'plastico',
    name: 'Plástico (Garrafa PET)',
    instructions: 'Esvazie, amasse e tampe. Descarte no cesto de PLÁSTICOS.',
    impact: 'A reciclagem de PET reduz a poluição e a necessidade de extrair mais petróleo.',
    imageKeywords: ['garrafa', 'pet', 'plástico', 'refrigerante', 'água', 'bebida'],
  },
  'embalagem de iogurte': {
    type: 'plastico',
    name: 'Plástico (Embalagem de Iogurte)',
    instructions: 'Lave para remover resíduos orgânicos. Descarte no cesto de PLÁSTICOS.',
    impact: 'Reciclar plástico economiza recursos naturais e energia.',
    imageKeywords: ['iogurte', 'pote', 'plástico', 'embalagem', 'lácteo'],
  },
  'sacolas plásticas': {
    type: 'plastico',
    name: 'Plástico (Sacolas Plásticas)',
    instructions: 'Reutilize sempre que possível. Descarte no cesto de PLÁSTICOS.',
    impact: 'A reciclagem das sacolas ajuda a reduzir a poluição ambiental.',
    imageKeywords: ['sacola', 'plástica', 'supermercado', 'reutilizável'],
  },
  'canudos plásticos': {
    type: 'plastico',
    name: 'Plástico (Canudos)',
    instructions: 'Evite o uso sempre que possível. Descarte no cesto de PLÁSTICOS.',
    impact: 'Canudos plásticos poluem oceanos e prejudicam a vida marinha.',
    imageKeywords: ['canudo', 'plástico', 'descartável'],
  },
  'embalagem de shampoo': {
    type: 'plastico',
    name: 'Plástico (Embalagem de Shampoo)',
    instructions: 'Lave para remover o resíduo. Descarte no cesto de PLÁSTICOS.',
    impact: 'Plásticos reciclados economizam energia e reduzem poluição.',
    imageKeywords: ['shampoo', 'embalagem', 'plástico', 'cosmético'],
  },
  'tampas de garrafa': {
    type: 'plastico',
    name: 'Plástico (Tampas de Garrafa)',
    instructions: 'Separe e descarte no cesto de PLÁSTICOS.',
    impact: 'Reciclagem de tampas reduz a produção de plásticos novos.',
    imageKeywords: ['tampa', 'garrafa', 'plástico'],
  },

  // --- Metais ---
  'lata de refrigerante': {
    type: 'metal',
    name: 'Metal (Lata de Refrigerante)',
    instructions: 'Amasse para reduzir o volume. Descarte no cesto de METAIS.',
    impact: 'Reciclar alumínio economiza até 95% da energia necessária para produzir o metal do zero.',
    imageKeywords: ['lata', 'alumínio', 'refrigerante', 'cerveja', 'bebida'],
  },
  'lata de alimentos': {
    type: 'metal',
    name: 'Metal (Lata de Alimentos)',
    instructions: 'Lave para remover resíduos de alimentos. Descarte no cesto de METAIS.',
    impact: 'A reciclagem de latas economiza recursos minerais e energia.',
    imageKeywords: ['lata', 'alimentos', 'conserva', 'metal', 'feijão', 'ervilha'],
  },
  'panelas de alumínio': {
    type: 'metal',
    name: 'Metal (Panelas de Alumínio)',
    instructions: 'Certifique-se de que estão limpas. Descarte no cesto de METAIS.',
    impact: 'Reciclagem de alumínio economiza recursos naturais e energia.',
    imageKeywords: ['panela', 'alumínio', 'cozinha', 'metal'],
  },

  // --- Vidros ---
  'garrafa de vidro': {
    type: 'vidro',
    name: 'Vidro (Garrafa)',
    instructions: 'Certifique-se de que está vazio. Descarte no cesto de VIDRO.',
    impact: 'O vidro é 100% reciclável e pode ser reutilizado infinitamente.',
    imageKeywords: ['garrafa', 'vidro', 'transparente', 'cerveja', 'vinho'],
  },
  'vidro quebrado': {
    type: 'vidro',
    name: 'Vidro (Objetos Quebrados)',
    instructions: 'Embale cuidadosamente em jornal antes de descartar no cesto de VIDRO.',
    impact: 'Vidro reciclado reduz o consumo de energia na produção de novos produtos.',
    imageKeywords: ['vidro', 'cacos', 'quebrado', 'garrafa'],
  },

  // --- Papéis ---
  'papelão': {
    type: 'papel',
    name: 'Papelão',
    instructions: 'Desmonte caixas para economizar espaço. Descarte no cesto de PAPEL.',
    impact: 'A reciclagem de papelão ajuda a reduzir o desmatamento e economizar energia.',
    imageKeywords: ['caixa', 'papelão', 'embalagem', 'papel'],
  },
  'papel de escritório': {
    type: 'papel',
    name: 'Papel (Papel de Escritório)',
    instructions: 'Não amasse. Descarte no cesto de PAPEL.',
    impact: 'A reciclagem de papel economiza árvores, água e energia.',
    imageKeywords: ['papel', 'escritório', 'sulfite', 'documento'],
  },
  'jornais': {
    type: 'papel',
    name: 'Papel (Jornais)',
    instructions: 'Empilhe e descarte no cesto de PAPEL.',
    impact: 'Jornais reciclados ajudam a reduzir o desperdício de papel.',
    imageKeywords: ['jornal', 'papel', 'notícia'],
  },

  // --- Orgânicos ---
  'casca de banana': {
    type: 'organico',
    name: 'Orgânico (Casca de Banana)',
    instructions: 'Descarte no cesto de ORGÂNICOS para compostagem.',
    impact: 'A compostagem reduz o metano em aterros e cria adubo natural.',
    imageKeywords: ['banana', 'casca', 'fruta', 'orgânico'],
  },
  'restos de comida': {
    type: 'organico',
    name: 'Orgânico (Restos de Comida)',
    instructions: 'Descarte no cesto de ORGÂNICOS ou utilize para compostagem.',
    impact: 'A compostagem de resíduos orgânicos reduz o impacto ambiental.',
    imageKeywords: ['comida', 'restos', 'alimento', 'orgânico'],
  },

  // --- Eletrônicos ---
  'pilha': {
    type: 'eletronico',
    name: 'Lixo Eletrônico (Pilha)',
    instructions: 'Procure pontos de coleta específicos. Não descarte no lixo comum.',
    impact: 'Pilhas contêm metais pesados que contaminam o solo e a água.',
    imageKeywords: ['pilha', 'bateria', 'energia', 'perigoso'],
  },
  'celular quebrado': {
    type: 'eletronico',
    name: 'Lixo Eletrônico (Celular Quebrado)',
    instructions: 'Leve a um ponto de coleta de lixo eletrônico.',
    impact: 'O descarte correto evita a contaminação por metais pesados.',
    imageKeywords: ['celular', 'smartphone', 'eletrônico', 'quebrado'],
  },

  // --- Não Recicláveis ---
  'bituca de cigarro': {
    type: 'nao_reciclavel',
    name: 'Rejeito (Bituca de Cigarro)',
    instructions: 'Apague bem antes de descartar no lixo comum.',
    impact: 'As bitucas contêm toxinas que poluem o solo e a água.',
    imageKeywords: ['bituca', 'cigarro', 'tabaco'],
  },
  'guardanapo sujo': {
    type: 'nao_reciclavel',
    name: 'Rejeito (Guardanapo Sujo)',
    instructions: 'Descarte no lixo comum. Não misture com recicláveis.',
    impact: 'Guardanapos sujos contaminam materiais recicláveis.',
    imageKeywords: ['guardanapo', 'sujo', 'papel'],
  },
};

// --- Componente Principal ---
export default function App() {
  const [itemName, setItemName] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Solicitar permissões de câmera e galeria
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const galleryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (galleryStatus.status !== 'granted') {
          Alert.alert('Permissão Negada', 'Precisamos de permissão para acessar sua galeria.');
        }
        const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
        if (cameraStatus.status !== 'granted') {
          Alert.alert('Permissão Negada', 'Precisamos de permissão para acessar sua câmera.');
        }
      }
    })();
  }, []);

  // Função para selecionar imagem da galeria
  const pickImageAsync = async () => {
    setResult(null);
    setItemName('');
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!pickerResult.canceled) {
      const imageUri = pickerResult.assets[0].uri;
      setSelectedImage(imageUri);
      simulateImageAnalysisWithTags(imageUri);
    } else {
      setSelectedImage(null);
    }
  };

  // Função para tirar foto
  const takePhotoAsync = async () => {
    setResult(null);
    setItemName('');
    const pickerResult = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!pickerResult.canceled) {
      const imageUri = pickerResult.assets[0].uri;
      setSelectedImage(imageUri);
      simulateImageAnalysisWithTags(imageUri);
    } else {
      setSelectedImage(null);
    }
  };

  // Função para encontrar item por tags
  const findItemByTags = (tags) => {
    if (!tags || tags.length === 0) return null;

    let bestMatch = null;
    let maxMatches = 0;

    const lowerCaseTags = tags.map((tag) => tag.toLowerCase());

    for (const key in wasteData) {
      const item = wasteData[key];
      let currentMatches = 0;
      const itemKeywords = item.imageKeywords.map((kw) => kw.toLowerCase());

      lowerCaseTags.forEach((tag) => {
        if (itemKeywords.includes(tag)) {
          currentMatches++;
        } else if (itemKeywords.some((kw) => kw.includes(tag))) {
          currentMatches += 0.5;
        }
      });

      if (currentMatches > maxMatches) {
        maxMatches = currentMatches;
        bestMatch = item;
      }
    }

    return maxMatches >= 1 ? bestMatch : null;
  };

  // Função para analisar imagem com tags
  const simulateImageAnalysisWithTags = async (imageUri) => {
    setIsLoading(true);
    setResult(null);

    try {
      const auth = encode(`${IMAGGA_API.key}:${IMAGGA_API.secret}`);
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        name: 'image.jpg',
        type: 'image/jpeg',
      });

      const response = await axios.post('https://api.imagga.com/v2/tags', formData, {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      const tags = response.data.result.tags.map((tag) => tag.tag.en.toLowerCase());
      const foundItem = findItemByTags(tags);

      if (foundItem) {
        setResult(foundItem);
      } else {
        setResult({
          type: 'desconhecido',
          name: 'Item não identificado',
          instructions: 'Tente tirar outra foto mais clara ou digite o nome do item.',
          impact: 'O reconhecimento de itens melhora com imagens bem iluminadas e nítidas.',
        });
      }
    } catch (error) {
      console.error('Erro ao analisar imagem:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao processar a imagem. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para busca por texto
  const handleTextSearch = () => {
    if (!itemName.trim()) {
      Alert.alert('Entrada Inválida', 'Por favor, digite o nome de um item.');
      return;
    }
    setSelectedImage(null);
    setIsLoading(true);
    setResult(null);

    setTimeout(() => {
      const searchName = itemName.toLowerCase().trim();
      let foundItem = wasteData[searchName];

      if (!foundItem) {
        const searchTags = searchName.split(/[\s,]+/);
        foundItem = findItemByTags(searchTags);
      }

      if (foundItem) {
        setResult(foundItem);
      } else {
        setResult({
          type: 'desconhecido',
          name: 'Item não encontrado',
          instructions: 'Não encontramos este item. Verifique a ortografia ou tente termos mais genéricos.',
          impact: 'Cada resíduo no lugar certo faz a diferença!',
        });
      }
      setIsLoading(false);
    }, 1500);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Lixeira Inteligente</Text>
      </View>
      <Text style={styles.instructionsText}>
        Tire uma foto do resíduo ou digite o nome para saber onde descartar:
      </Text>

      <View style={styles.inputSection}>
        <TouchableOpacity style={styles.button} onPress={pickImageAsync}>
          <Text style={styles.buttonText}>📷 Escolher da Galeria</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={takePhotoAsync}>
          <Text style={styles.buttonText}>📸 Tirar Foto</Text>
        </TouchableOpacity>

        {selectedImage && (
          <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
        )}

        <TextInput
          style={styles.input}
          placeholder="Ex: garrafa pet, lata..."
          value={itemName}
          onChangeText={setItemName}
          onSubmitEditing={handleTextSearch}
        />

        <TouchableOpacity
          style={[styles.button, styles.identifyButton]}
          onPress={handleTextSearch}
          disabled={isLoading}>
          <Text style={styles.buttonText}>
            {isLoading ? 'Analisando...' : '🔎 Identificar Resíduo'}
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading && <ActivityIndicator size="large" color="#3498db" />}

      {result && (
        <View style={styles.resultSection}>
          <Text style={styles.resultTitle}>Resultado:</Text>
          <Text style={styles.binIcon}>{binIcons[result.type]}</Text>
          <Text style={styles.resultText}>{result.name}</Text>
          <Text style={styles.resultText}>{result.instructions}</Text>
          <Text style={styles.resultText}>{result.impact}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  instructionsText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  inputSection: {
    marginVertical: 20,
    width: '100%',
    alignItems: 'center',
  },
  button: {
    padding: 15,
    backgroundColor: '#3498db',
    borderRadius: 8,
    marginBottom: 10,
    width: '80%',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginVertical: 15,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 10,
    width: '80%',
  },
  identifyButton: {
    backgroundColor: '#2ecc71',
  },
  resultSection: {
    marginVertical: 20,
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  binIcon: {
    fontSize: 50,
    textAlign: 'center',
    marginVertical: 10,
  },
  resultText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 5,
  },
});