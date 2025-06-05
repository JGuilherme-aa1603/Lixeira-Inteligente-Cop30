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
import { OPENAI_API_KEY } from './openai.config';

import categorias_lixo from './categorias_lixo.json';


export default function App() {
  const [itemName, setItemName] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const analyzeImageWithOpenAI = async (imageUri) => {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
      });
      reader.readAsDataURL(blob);
      const base64Image = await base64Promise;


      const openaiResponse = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'Você é um especialista em reciclagem e descarte correto de resíduos. Ao receber uma imagem de um objeto, responda SEMPRE no formato:\nEmoji: [um emoji que representa o objeto ou resíduo]\nInstruções: [explicação detalhada em português de como descartar corretamente, com dicas e locais apropriados].'
            },
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Explique como descartar corretamente o objeto da imagem, com dicas e instruções detalhadas.' },
                { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
              ]
            }
          ],
          max_tokens: 350
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const resposta = openaiResponse.data.choices[0].message.content.trim();
      const emojiMatch = resposta.match(/Emoji:\s*([\p{Emoji_Presentation}\p{Extended_Pictographic}])/u);
      const instrucoesMatch = resposta.match(/Instruções:\s*([\s\S]*)/i);
      setResult({
        emoji: emojiMatch ? emojiMatch[1] : '❓',
        name: 'Instruções de Descarte',
        instructions: instrucoesMatch ? instrucoesMatch[1].trim() : resposta,
        impact: '',
        binColor: '',
      });
    } catch (error) {
      console.error('Erro ao analisar imagem com OpenAI:', error?.response?.data || error);
      Alert.alert('Erro', 'Ocorreu um erro ao processar a imagem. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const simulateImageAnalysisWithTags = analyzeImageWithOpenAI;

  const handleTextSearch = async () => {
    if (!itemName.trim()) {
      Alert.alert('Entrada Inválida', 'Por favor, digite o nome de um item.');
      return;
    }
    setSelectedImage(null);
    setIsLoading(true);
    setResult(null);

    try {
      const openaiResponse = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'Você é um especialista em reciclagem e descarte correto de resíduos. Ao receber o nome de um objeto, responda SEMPRE no formato:\nEmoji: [um emoji que representa o objeto ou resíduo]\nInstruções: [explicação direta, curta, amigável e em português de como descartar corretamente, com dicas e locais apropriados]. Seja objetivo, prático e incentive o descarte correto.'
            },
            {
              role: 'user',
              content: `Explique como descartar corretamente: ${itemName}`
            }
          ],
          max_tokens: 300
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const resposta = openaiResponse.data.choices[0].message.content.trim();
      const emojiMatch = resposta.match(/Emoji:\s*([\p{Emoji_Presentation}\p{Extended_Pictographic}])/u);
      const instrucoesMatch = resposta.match(/Instruções:\s*([\s\S]*)/i);
      setResult({
        emoji: emojiMatch ? emojiMatch[1] : '❓',
        name: 'Instruções de Descarte',
        instructions: instrucoesMatch ? instrucoesMatch[1].trim() : resposta,
        impact: '',
        binColor: '',
      });
    } catch (error) {
      console.error('Erro ao analisar texto com OpenAI:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao processar o texto. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
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
          <Text style={styles.binIcon}>{result.emoji}</Text>
          <Text style={styles.resultText}>{result.name}</Text>
          {result.instructions
            .replace(/[#*]+/g, '')
            .split(/\n{2,}|\r{2,}|\r\n{2,}/)
            .map((par, idx) => (
              <Text key={idx} style={styles.resultInstruction}>
                {par.trim().replace(/(dica:|atenção:|importante:)/gi, match => `\u2022 ${match.toUpperCase()}`)}
              </Text>
            ))}
          {result.impact ? <Text style={styles.resultImpact}>{result.impact}</Text> : null}
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
  resultInstruction: {
    fontSize: 15,
    textAlign: 'left',
    marginVertical: 1,
    color: '#2c3e50',
    backgroundColor: '#eaf6fb',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    width: '98%',
    maxWidth: '98%',
    alignSelf: 'center',
    flexWrap: 'wrap', 
  },
  resultImpact: {
    fontSize: 15,
    color: '#16a085',
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
});