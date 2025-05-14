import { useState, useEffect } from 'react';
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

import categorias_lixo from './categorias_lixo.json';

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

// --- Cores dos Lixos ---
const binColors = {
  papel: '🟦',
  plastico: '🟥',
  vidro: '🟩',
  metal: '🟨',
  organico: '🟫',
  eletronico: '⬜',
  perigoso: '⬛',
  nao_reciclavel: '⬛',
  desconhecido: 'Descarte Desconhecido ❓',
};

const categoryMap = {
  papel: categorias_lixo.paper,
  plastico: categorias_lixo.plastic,
  vidro: categorias_lixo.glass,
  metal: categorias_lixo.metal,
  organico: categorias_lixo.organic,
  eletronico: categorias_lixo.electronic,
  perigoso: categorias_lixo.hazardous,
  nao_reciclavel: categorias_lixo.non_recyclable,
};

// Função para encontrar a categoria por tags
const findCategoryByTags = (tags) => {
  if (!tags || tags.length === 0) return null;

  const lowerCaseTags = tags.map((tag) => tag.toLowerCase());
  
  // Itera sobre as categorias para encontrar a melhor correspondência
  let bestCategory = 'desconhecido';
  let maxMatches = 0;

for (const [category, keywords] of Object.entries(categoryMap)) {
  // Verifica se keywords está definido e é um array
  if (!Array.isArray(keywords) || keywords.length === 0) {
    console.warn(`A categoria "${category}" não possui palavras-chave definidas.`);
    continue; // Pula para a próxima categoria
  }

  const matches = lowerCaseTags.filter((tag) => keywords.includes(tag)).length;

  if (matches > maxMatches) {
    maxMatches = matches;
    bestCategory = category;
  }
}

  return bestCategory;
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
      const foundCategory = findCategoryByTags(tags);

      if (foundCategory && foundCategory !== 'desconhecido') {
        setResult({
          type: foundCategory,
          name: `Categoria: ${foundCategory.toUpperCase()}`,
          instructions: `Descarte no cesto correspondente à categoria ${foundCategory.toUpperCase()}.`,
          impact: 'Separar resíduos corretamente ajuda a preservar o meio ambiente.',
          binColor: binColors[foundCategory],
        });
      } else {
        setResult({
          type: 'desconhecido',
          name: 'Categoria não identificada',
          instructions: 'Tente tirar outra foto mais clara ou digite o nome do item.',
          impact: 'O reconhecimento de itens melhora com imagens bem iluminadas e nítidas.',
          binColor: binColors['desconhecido'],
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
      const searchTags = searchName.split(/[\s,]+/);
      const foundCategory = findCategoryByTags(searchTags);

      if (foundCategory && foundCategory !== 'desconhecido') {
        setResult({
          type: foundCategory,
          name: `Categoria: ${foundCategory.toUpperCase()}`,
          instructions: `Descarte no cesto correspondente à categoria ${foundCategory.toUpperCase()}.`,
          impact: 'Separar resíduos corretamente ajuda a preservar o meio ambiente.',
          binColor: binColors[foundCategory],
        });
      } else {
        setResult({
          type: 'desconhecido',
          name: 'Categoria não encontrada',
          instructions: 'Não encontramos esta categoria. Verifique a ortografia ou tente termos mais genéricos.',
          impact: 'Cada resíduo no lugar certo faz a diferença!',
          binColor: binColors['desconhecido'],
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
          <Text style={styles.resultText}>Cor do Lixo: {result.binColor}</Text>
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