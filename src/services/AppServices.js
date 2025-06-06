import { useState } from 'react';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { OPENAI_API_KEY } from '../../openai.config.js';
  
export function useAppServices() {
    const [itemName, setItemName] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

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
        analyzeImageWithOpenAI(imageUri);
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
        analyzeImageWithOpenAI(imageUri);
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
                content: 'Você é um especialista em reciclagem e descarte correto de resíduos. Ao receber o nome de um objeto, responda SEMPRE no formato:\nEmoji: [um emoji que representa o objeto ou resíduo]\nInstruções: [explicação direta, curta, amigável e em português de como descartar corretamente, com dicas e locais apropriados]. Seja objetivo, prático e incentive o descarte correto.'
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

    return {
        pickImageAsync,
        takePhotoAsync,
        analyzeImageWithOpenAI,
        handleTextSearch,
        itemName,
        setItemName,
        selectedImage,
        setSelectedImage,
        result,
        setResult,
        isLoading,
        setIsLoading
    };
}
